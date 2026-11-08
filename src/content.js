(() => {
  if (window.__aiWebShieldContentLoaded) return;
  window.__aiWebShieldContentLoaded = true;

  const allowedInputTypes = new Set(['text', 'email', 'tel', 'search', 'url']);
  const approvedForms = new WeakSet();
  let pendingReview = null;
  let panelHost = null;
  let panelRoot = null;
  let safetyHost = null;
  let safetyRoot = null;
  let explanationTimer = null;
  let explanationVisible = false;
  let pageRisk = {
    level: 'unknown',
    message: 'Run a scan from the AI WebShield extension button to check this page.',
    hostname: window.location.hostname.toLowerCase(),
    signals: [],
  };
  let pageRiskReady = false;

  // Rules are intentionally small and explainable for the first prototype.
  // The eight-digit rule is broad by design and may produce false positives.
  const rules = [
    { category: 'email-like text', token: '[REDACTED_EMAIL]', source: '\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b', flags: 'gi' },
    { category: '8-digit number-like text', token: '[REDACTED_NUMBER]', source: '\\b\\d{8}\\b', flags: 'g' },
    { category: 'fake HKID demo marker', token: '[REDACTED_TEST_ID]', source: '\\bFAKE-HKID-\\d{3}\\b', flags: 'gi' },
  ];

  const knownBrandDomains = [
    { name: 'Google', domains: ['google.com', 'gmail.com'], aliases: ['google', 'gmail'] },
    { name: 'Microsoft', domains: ['microsoft.com', 'outlook.com', 'office.com', 'live.com'], aliases: ['microsoft', 'outlook', 'office', 'live'] },
    { name: 'Apple', domains: ['apple.com', 'icloud.com'], aliases: ['apple', 'icloud'] },
    { name: 'PayPal', domains: ['paypal.com'], aliases: ['paypal'] },
    { name: 'Amazon', domains: ['amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.co.jp'], aliases: ['amazon'] },
    { name: 'Facebook', domains: ['facebook.com', 'instagram.com'], aliases: ['facebook', 'instagram'] },
    { name: 'Netflix', domains: ['netflix.com'], aliases: ['netflix'] },
    { name: 'GitHub', domains: ['github.com'], aliases: ['github'] },
  ];

  function getSupportedFields(form) {
    const fields = [];
    let textFieldNumber = 0;
    for (const element of Array.from(form.elements)) {
      const tag = element.tagName;
      if (tag === 'TEXTAREA') {
        textFieldNumber += 1;
        fields.push({ element, label: `Text field ${textFieldNumber}` });
        continue;
      }
      if (tag !== 'INPUT') continue;
      const type = (element.type || '').toLowerCase();
      // Password input values are never read. Only the input's type is checked.
      if (type === 'password' || !allowedInputTypes.has(type)) continue;
      textFieldNumber += 1;
      fields.push({ element, label: `Text field ${textFieldNumber}` });
    }
    return fields;
  }

  function analyzeValue(value) {
    let maskedValue = value;
    const categories = [];
    const tokenLabels = [];
    let totalMatches = 0;

    for (const rule of rules) {
      const regex = new RegExp(rule.source, rule.flags);
      const matches = Array.from(value.matchAll(regex));
      if (matches.length === 0) continue;
      totalMatches += matches.length;
      categories.push({ name: rule.category, count: matches.length });
      tokenLabels.push(rule.token);
      maskedValue = maskedValue.replace(new RegExp(rule.source, rule.flags), rule.token);
    }
    return { maskedValue, categories, tokenLabels, totalMatches };
  }

  function collectFindings(form) {
    const findings = [];
    for (const field of getSupportedFields(form)) {
      // Read only supported non-password text controls.
      const originalValue = field.element.value;
      if (!originalValue) continue;
      const result = analyzeValue(originalValue);
      if (result.totalMatches === 0) continue;
      findings.push({
        element: field.element,
        label: field.label,
        originalValue,
        maskedValue: result.maskedValue,
        categories: result.categories,
        tokenLabels: result.tokenLabels,
      });
    }
    return findings;
  }

  function isIpv4Address(hostname) {
    const parts = hostname.split('.');
    return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
  }

  function findBrandImitation(hostname) {
    const labels = hostname.split('.');
    return knownBrandDomains.find((brand) => {
      const isOfficialDomain = brand.domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
      const mentionsBrand = brand.aliases.some((alias) => labels.some((label) => label.includes(alias)));
      return mentionsBrand && !isOfficialDomain;
    }) || null;
  }

  function isLoopbackHost(hostname) {
    return hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '::1' || hostname === '[::1]' || hostname.startsWith('127.');
  }

  function inspectPageLocally() {
    const hostname = window.location.hostname.toLowerCase();
    const isHttps = window.location.protocol === 'https:';
    const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'));
    const loginForms = Array.from(document.forms).filter((form) => form.querySelector('input[type="password"]'));
    const signals = [];
    const add = (signal, severity) => signals.push({ signal, severity });

    if (passwordInputs.length && !isHttps && !isLoopbackHost(hostname)) add('A password field is present on an unencrypted HTTP page.', 'high');
    if (passwordInputs.some((input) => input.form && input.form.method.toLowerCase() === 'get')) {
      add('A sign-in form uses GET, which can place submitted fields in the page URL.', 'high');
    }

    const imitation = findBrandImitation(hostname);
    if (loginForms.length && imitation) {
      add(`The host contains the ${imitation.name} name but is outside its known domains.`, 'caution');
    }

    let sendsCredentialsOffSite = false;
    let sendsCredentialsOverHttp = false;
    let hasOffSiteForm = false;
    let asksForSeveralPersonalFields = false;
    for (const form of Array.from(document.forms)) {
      const hasPassword = Boolean(form.querySelector('input[type="password"]'));
      const action = form.getAttribute('action');
      if (action) {
        try {
          const actionUrl = new URL(action, window.location.href);
          if (actionUrl.origin !== window.location.origin) {
            hasOffSiteForm = true;
            if (hasPassword) sendsCredentialsOffSite = true;
          }
          if (hasPassword && actionUrl.protocol === 'http:' && !isLoopbackHost(actionUrl.hostname)) sendsCredentialsOverHttp = true;
        } catch (_error) { /* Ignore malformed form actions and report other signals. */ }
      }

      if (hasPassword) {
        const personalFieldCount = Array.from(form.querySelectorAll('input,textarea')).filter((field) => {
          const metadata = `${field.name} ${field.id} ${field.autocomplete} ${field.type}`.toLowerCase();
          return /email|tel|phone|mobile|hkid|passport|national.?id|address|birth|dob|ssn/.test(metadata);
        }).length;
        if (personalFieldCount >= 3) asksForSeveralPersonalFields = true;
      }
    }

    if (sendsCredentialsOverHttp) add('A sign-in form sends credentials over unencrypted HTTP.', 'high');
    else if (sendsCredentialsOffSite && loginForms.length) add('A sign-in form sends credentials to a different site; this can be legitimate, so verify the destination.', 'caution');
    else if (hasOffSiteForm) add('A form sends information to a different site.', 'caution');

    const hasLogin = loginForms.length > 0;
    if (hasLogin && hostname.split('.').some((label) => label.startsWith('xn--'))) {
      add('The sign-in page uses a punycode hostname that may visually resemble another name.', 'caution');
    }
    if (hasLogin && isIpv4Address(hostname)) add('The sign-in page uses a raw IP address instead of a domain name.', 'caution');

    if (hasLogin && asksForSeveralPersonalFields) {
      add('The sign-in form requests several kinds of personal information.', 'caution');
    }

    const visibleText = (document.body && document.body.innerText || '').slice(0, 12000);
    const urgencyLanguage = /\b(urgent|immediately|within\s+\d+\s+hours?|today|suspend(?:ed|sion)?|locked|expire(?:s|d)?|verify now|action required|unusual activity)\b/i.test(visibleText);
    if (hasLogin && urgencyLanguage) add('Urgent account language appears alongside a sign-in form.', 'caution');

    const highestSeverity = signals.some((item) => item.severity === 'high') ? 'high' : signals.length ? 'caution' : 'neutral';
    return { hostname, level: highestSeverity, signals: signals.map((item) => item.signal) };
  }

  function sendRuntimeMessage(message) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          const failed = Boolean(chrome.runtime.lastError);
          resolve(failed ? null : response || null);
        });
      } catch (_error) { resolve(null); }
    });
  }

  function getReportedHosts() {
    return new Promise((resolve) => {
      chrome.storage.local.get({ reportedScamHosts: [] }, (result) => {
        void chrome.runtime.lastError;
        resolve(Array.isArray(result && result.reportedScamHosts) ? result.reportedScamHosts : []);
      });
    });
  }

  async function runPageScan() {
    const local = inspectPageLocally();
    const reputation = await sendRuntimeMessage({ type: 'WEB_SHIELD_LOOKUP_URL' }) || { status: 'unavailable' };
    const reportedHosts = await getReportedHosts();
    let level = local.level;
    let message = '';

    if (reportedHosts.includes(local.hostname)) {
      level = 'high';
      message = `You reported ${local.hostname} in this browser. Treat it as high risk.`;
    } else if (reputation.status === 'match') {
      level = 'high';
      const threats = Array.isArray(reputation.threatTypes) ? reputation.threatTypes.join(', ') : 'known threat';
      message = `Google Safe Browsing found a match (${threats}). Do not enter information unless you expected this site.`;
    } else if (local.level === 'high') {
      message = `High-risk page signals: ${local.signals.join(' ')}`;
    } else if (local.level === 'caution') {
      const apiNote = reputation.status === 'not_listed' ? ' No Safe Browsing list match was found.' : ' URL reputation could not be confirmed.';
      message = `Review this page: ${local.signals.join(' ')}${apiNote}`;
    } else if (reputation.status === 'not_listed') {
      level = 'neutral';
      message = 'No Safe Browsing match or strong local warning pattern was found. This does not guarantee that the site is safe.';
    } else {
      level = 'unknown';
      message = `${reputation.message || 'URL reputation is unavailable.'} No strong local warning pattern was found, so this page is unverified.`;
    }

    pageRisk = { level, message, hostname: local.hostname, signals: local.signals, reputationStatus: reputation.status || 'unavailable' };
    pageRiskReady = true;
    renderSafetySignal(true);
    if (pageRisk.level === 'high') showPageRiskWarning();
    sendRuntimeMessage({ type: 'WEB_SHIELD_PAGE_RISK', level: pageRisk.level });
    return { active: true, level: pageRisk.level, message: pageRisk.message, reputationStatus: pageRisk.reputationStatus };
  }

  function ensureSafetySignal() {
    if (safetyHost) return;
    safetyHost = document.createElement('div');
    safetyHost.id = 'ai-webshield-safety-host';
    safetyHost.setAttribute('data-ai-webshield-ui', 'true');
    safetyRoot = safetyHost.attachShadow({ mode: 'closed' });
    safetyRoot.innerHTML = `
      <style>
        :host { all: initial; }
        .wrap { position: fixed; right: 20px; bottom: 20px; z-index: 2147483646; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; font: 14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        .bubble { display: none; box-sizing: border-box; width: max-content; max-width: min(320px, calc(100vw - 32px)); padding: 12px 14px; border: 1px solid #dadce0; border-radius: 12px; background: #fff; color: #202124; box-shadow: 0 4px 16px rgba(60,64,67,.22); overflow-wrap: anywhere; word-break: break-word; }
        .bubble.visible { display: block; }
        .signal { display: grid; place-items: center; width: 58px; height: 58px; border: 2px solid rgba(255,255,255,.95); border-radius: 50%; color: #fff; box-shadow: 0 3px 14px rgba(0,0,0,.28); cursor: pointer; font: 700 24px/1 system-ui,sans-serif; }
        .signal:focus-visible { outline: 3px solid #1a73e8; outline-offset: 3px; }
        .green { background: #188038; } .yellow { background: #f9ab00; color: #202124; } .red { background: #d93025; } .unknown { background: #5f6368; }
      </style>
      <div class="wrap"><div class="bubble" id="ws-signal-message" role="status"></div><button type="button" class="signal" id="ws-signal-button" aria-label="Website safety signal" aria-expanded="false"></button></div>`;
    safetyRoot.getElementById('ws-signal-button').addEventListener('click', () => {
      if (pageRisk.level === 'high') { showPageRiskWarning(); return; }
      setExplanationVisible(!explanationVisible, true);
    });
    (document.documentElement || document).appendChild(safetyHost);
  }

  function setExplanationVisible(visible, timed) {
    if (!safetyRoot) return;
    explanationVisible = visible;
    const bubble = safetyRoot.getElementById('ws-signal-message');
    const button = safetyRoot.getElementById('ws-signal-button');
    bubble.classList.toggle('visible', visible);
    button.setAttribute('aria-expanded', String(visible));
    if (explanationTimer) window.clearTimeout(explanationTimer);
    explanationTimer = null;
    if (visible && timed) explanationTimer = window.setTimeout(() => setExplanationVisible(false, false), 3000);
  }

  function renderSafetySignal(showBriefly) {
    ensureSafetySignal();
    const button = safetyRoot.getElementById('ws-signal-button');
    const bubble = safetyRoot.getElementById('ws-signal-message');
    const status = pageRisk.level === 'high' ? 'red' : pageRisk.level === 'caution' ? 'yellow' : pageRisk.level === 'neutral' ? 'green' : 'unknown';
    button.className = `signal ${status}`;
    button.textContent = status === 'green' ? '✓' : status === 'unknown' ? '?' : '!';
    button.setAttribute('aria-label', `${status} safety signal. Click for explanation.`);
    bubble.textContent = pageRisk.message;
    if (showBriefly && status !== 'red') setExplanationVisible(true, true);
    else setExplanationVisible(false, false);
  }

  function saveReportedHost(callback) {
    const storage = chrome.storage && chrome.storage.local;
    if (!storage || !pageRisk.hostname) { callback(false); return; }
    storage.get({ reportedScamHosts: [] }, (result) => {
      void chrome.runtime.lastError;
      const hosts = Array.isArray(result && result.reportedScamHosts) ? result.reportedScamHosts : [];
      if (!hosts.includes(pageRisk.hostname)) hosts.push(pageRisk.hostname);
      storage.set({ reportedScamHosts: hosts }, () => {
        const failed = Boolean(chrome.runtime.lastError);
        if (!failed) {
          pageRisk = { ...pageRisk, level: 'high', message: `This site is now on your local block list: ${pageRisk.hostname}.` };
          renderSafetySignal(false);
        }
        callback(!failed);
      });
    });
  }

  function showPageRiskWarning() {
    if (pageRisk.level !== 'high') return;
    const feedback = document.createElement('p');
    feedback.className = 'privacy';
    feedback.textContent = 'Reported hostnames are saved only in this browser. Page text and form values are not sent.';
    const detail = document.createElement('p');
    detail.textContent = pageRisk.message;
    const report = makeButton('Report this site', () => {
      report.disabled = true;
      saveReportedHost((saved) => {
        feedback.textContent = saved ? `Reported. ${pageRisk.hostname} is saved in this browser’s local block list.` : 'Could not save the report in this browser.';
        report.disabled = false;
      });
    });
    setPanelContent(
      'This page has a red safety signal. Leave if you did not expect this site.',
      [detail, feedback],
      [
        makeButton('Go back', () => {
          if (window.history.length > 1) window.history.back();
          else closePanel();
        }, 'cancel'),
        report,
        makeButton('Stay on page', closePanel, 'primary'),
      ],
      'Website warning',
    );
  }

  function ensurePanel() {
    if (panelHost) return;
    panelHost = document.createElement('div');
    panelHost.id = 'ai-webshield-review-host';
    panelHost.setAttribute('data-ai-webshield-ui', 'true');
    panelRoot = panelHost.attachShadow({ mode: 'closed' });
    panelRoot.innerHTML = `
      <style>
        :host { all: initial; }
        .backdrop { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; padding: 18px; background: rgba(32,33,36,.24); font: 14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color: #202124; }
        .panel { width: min(100%, 460px); max-height: 80vh; overflow: auto; padding: 20px; border: 1px solid #dadce0; border-radius: 12px; background: #fff; box-shadow: 0 8px 30px rgba(0,0,0,.24); }
        h2 { margin: 0 0 8px; font-size: 18px; line-height: 1.3; }
        p { margin: 8px 0; }
        .detail { padding: 10px 12px; margin: 12px 0; background: #fff8e1; border-radius: 6px; }
        ul { margin: 6px 0 0; padding-left: 20px; }
        .privacy { color: #5f6368; font-size: 12px; }
        .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        button { appearance: none; border: 1px solid #dadce0; border-radius: 6px; padding: 9px 12px; background: #fff; color: #202124; font: inherit; font-weight: 600; cursor: pointer; }
        button:focus-visible { outline: 3px solid #8ab4f8; outline-offset: 2px; }
        button.primary { border-color: #1a73e8; background: #1a73e8; color: #fff; }
        button.cancel { color: #5f6368; }
      </style>
      <div class="backdrop">
        <section class="panel" role="dialog" aria-modal="true" aria-labelledby="ws-title" aria-describedby="ws-message">
          <h2 id="ws-title">Review before submitting</h2>
          <p id="ws-message"></p>
          <div class="detail" id="ws-detail"></div>
          <p class="privacy">Checks run in this tab. Typed text is not sent or persistently stored; password values are skipped.</p>
          <div class="actions" id="ws-actions"></div>
        </section>
      </div>`;
    panelHost.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (pendingReview) cancelReview();
        else closePanel();
      }
    });
    (document.documentElement || document).appendChild(panelHost);
  }

  function setPanelContent(message, detailNodes, buttons, title = 'Review before submitting') {
    ensurePanel();
    panelRoot.getElementById('ws-title').textContent = title;
    const messageNode = panelRoot.getElementById('ws-message');
    const detailNode = panelRoot.getElementById('ws-detail');
    const actionsNode = panelRoot.getElementById('ws-actions');
    messageNode.textContent = message;
    detailNode.replaceChildren(...detailNodes);
    actionsNode.replaceChildren(...buttons);
    const firstButton = actionsNode.querySelector('button');
    if (firstButton) firstButton.focus();
  }

  function makeButton(label, action, style = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    if (style) button.className = style;
    button.addEventListener('click', action);
    return button;
  }

  function initialDetail(findings) {
    const list = document.createElement('ul');
    for (const finding of findings) {
      const item = document.createElement('li');
      const categories = finding.categories.map((category) => `${category.name} (${category.count})`).join(', ');
      const tokens = finding.tokenLabels.join(', ');
      item.textContent = `${finding.label}: ${categories} → ${tokens}`;
      list.appendChild(item);
    }
    return [list];
  }

  function renderInitialReview() {
    const { findings } = pendingReview;
    const fields = findings.length;
    const categories = document.createElement('p');
    categories.textContent = `${fields} non-password text field${fields === 1 ? '' : 's'} contain pattern matches. The values themselves are not displayed here.`;
    setPanelContent(
      'Some text may contain personal information.',
      [categories, ...initialDetail(findings)],
      [
        makeButton('Apply masks for review', applyMasks, 'primary'),
        makeButton('Continue with original text', continueOriginal),
        makeButton('Cancel submission', cancelReview, 'cancel'),
      ],
    );
  }

  function applyMasks() {
    if (!pendingReview) return;
    for (const finding of pendingReview.findings) finding.element.value = finding.maskedValue;
    pendingReview.masked = true;
    const text = document.createElement('p');
    text.textContent = 'Suggested masks are now applied in the form. Review the visible fields; nothing has been submitted yet.';
    const list = document.createElement('ul');
    for (const token of new Set(pendingReview.findings.flatMap((finding) => finding.tokenLabels))) {
      const item = document.createElement('li');
      item.textContent = token;
      list.appendChild(item);
    }
    setPanelContent(
      'Review the masked version',
      [text, list],
      [
        makeButton('Submit masked version', submitPending, 'primary'),
        makeButton('Undo masks', undoMasks),
        makeButton('Cancel submission', cancelReview, 'cancel'),
      ],
    );
  }

  function undoMasks() {
    if (!pendingReview) return;
    for (const finding of pendingReview.findings) finding.element.value = finding.originalValue;
    pendingReview.masked = false;
    const text = document.createElement('p');
    text.textContent = 'The original text is restored. You can cancel and edit it, or explicitly continue once without masking.';
    setPanelContent(
      'Masks undone',
      [text],
      [
        makeButton('Continue with original text', continueOriginal, 'primary'),
        makeButton('Apply masks again', applyMasks),
        makeButton('Cancel submission', cancelReview, 'cancel'),
      ],
    );
  }

  function closePanel() {
    if (panelHost) panelHost.remove();
    panelHost = null;
    panelRoot = null;
  }

  function finishWithSubmission(useCurrentValues) {
    if (!pendingReview) return;
    const current = pendingReview;
    if (!useCurrentValues) {
      for (const finding of current.findings) finding.element.value = finding.originalValue;
    }
    pendingReview = null;
    closePanel();
    approvedForms.add(current.form);
    try {
      if (current.submitter && current.submitter.form === current.form) current.form.requestSubmit(current.submitter);
      else current.form.requestSubmit();
    } catch (_error) {
      approvedForms.delete(current.form);
      // Do not display or log entered values if a page cannot be resubmitted.
      window.alert('WebShield could not resume this form. Please submit it again manually.');
    }
    queueMicrotask(() => approvedForms.delete(current.form));
  }

  function submitPending() {
    finishWithSubmission(true);
  }

  function continueOriginal() {
    finishWithSubmission(false);
  }

  function cancelReview() {
    if (pendingReview && pendingReview.masked) {
      for (const finding of pendingReview.findings) finding.element.value = finding.originalValue;
    }
    pendingReview = null;
    closePanel();
  }

  function handleSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (approvedForms.has(form)) {
      approvedForms.delete(form);
      return;
    }
    if (pendingReview) {
      event.preventDefault();
      return;
    }

    const findings = collectFindings(form);
    if (findings.length === 0) return;

    event.preventDefault();
    pendingReview = { form, submitter: event.submitter || null, findings, masked: false };
    renderInitialReview();
  }

  document.addEventListener('submit', handleSubmit, true);

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && message.type === 'WEB_SHIELD_SCAN_NOW') {
      runPageScan().then(sendResponse).catch(() => {
        sendResponse({ active: false, level: 'unknown', message: 'The page scan could not be completed.' });
      });
      return true;
    }
    if (message && message.type === 'WEB_SHIELD_STATUS') {
      sendResponse({
        active: pageRiskReady,
        level: pageRisk.level,
        message: pageRisk.message,
      });
      return false;
    }
    return false;
  });
})();
