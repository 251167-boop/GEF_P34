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
    level: 'neutral',
    message: 'No demo warning signal was detected. This does not guarantee that a page is safe.',
    demoHost: window.location.hostname.toLowerCase(),
    isBlacklisted: false,
  };
  let pageRiskReady = false;

  // Rules are intentionally small and explainable for the first prototype.
  // The eight-digit rule is broad by design and may produce false positives.
  const rules = [
    { category: 'email-like text', token: '[REDACTED_EMAIL]', source: '\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b', flags: 'gi' },
    { category: '8-digit number-like text', token: '[REDACTED_NUMBER]', source: '\\b\\d{8}\\b', flags: 'g' },
    { category: 'fake HKID demo marker', token: '[REDACTED_TEST_ID]', source: '\\bFAKE-HKID-\\d{3}\\b', flags: 'gi' },
  ];

  const trustedDemoHosts = [
    'library.example.test',
    'school-portal.example.test',
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

  function getDomainParts(hostname) {
    const host = hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
    const dot = host.indexOf('.');
    if (dot < 1) return null;
    return { label: host.slice(0, dot), suffix: host.slice(dot) };
  }

  function isOneCharacterEdit(first, second) {
    if (first === second || Math.abs(first.length - second.length) > 1) return false;
    let left = 0;
    let right = 0;
    let edits = 0;
    while (left < first.length && right < second.length) {
      if (first[left] === second[right]) {
        left += 1;
        right += 1;
        continue;
      }
      edits += 1;
      if (edits > 1) return false;
      if (first.length > second.length) left += 1;
      else if (second.length > first.length) right += 1;
      else {
        left += 1;
        right += 1;
      }
    }
    if (left < first.length || right < second.length) edits += 1;
    return edits === 1;
  }

  function findLookalike(hostname) {
    const candidate = getDomainParts(hostname);
    if (!candidate) return null;
    for (const knownHost of trustedDemoHosts) {
      const known = getDomainParts(knownHost);
      if (!known || candidate.suffix !== known.suffix) continue;
      if (isOneCharacterEdit(candidate.label, known.label)) return knownHost;
    }
    return null;
  }

  function pageRequestsSensitiveInfo() {
    for (const form of Array.from(document.forms)) {
      for (const element of Array.from(form.elements)) {
        if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA') continue;
        const type = (element.type || '').toLowerCase();
        const autocomplete = (element.getAttribute('autocomplete') || '').toLowerCase();
        // Only inspect field metadata. Password field values are never read.
        if (type === 'password' || type === 'email' || type === 'tel') return true;
        if (/\b(username|current-password|new-password|email|tel|given-name|family-name)\b/.test(autocomplete)) return true;
      }
    }
    return false;
  }

  function assessPageRisk() {
    const hostname = window.location.hostname.toLowerCase();
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    let demoHost = hostname;
    const demoUrlText = document.body && document.body.dataset.webshieldDemoUrl;
    if (isLocalhost && demoUrlText) {
      try {
        demoHost = new URL(demoUrlText).hostname.toLowerCase();
      } catch (_error) {
        demoHost = hostname;
      }
    }
    if (!isLocalhost) {
      return { level: 'neutral', message: 'This build only assesses localhost sample pages.', demoHost, isBlacklisted: false };
    }

    const bundledEntries = globalThis.AI_WEBSHIELD_DEMO_SCAM_LINKS || [];
    const blacklistEntry = bundledEntries.find((entry) => {
      try { return new URL(entry.url).hostname.toLowerCase() === demoHost; } catch (_error) { return false; }
    });
    if (blacklistEntry) {
      return { level: 'high', message: `Blacklisted demo site: ${blacklistEntry.reason}`, demoHost, isBlacklisted: true };
    }

    const demoCase = document.body && document.body.dataset.webshieldDemoCase;
    if (demoCase === 'seeded-high-risk' && document.body.dataset.webshieldTestThreat === 'seeded-phishing-fixture') {
      return { level: 'high', message: 'High risk: this is the explicitly seeded high-risk demo fixture. Leave this sample page.', demoHost, isBlacklisted: false };
    }

    const requestsSensitiveInfo = pageRequestsSensitiveInfo();
    const similarHost = findLookalike(demoHost);
    if (requestsSensitiveInfo && similarHost) {
      return {
        level: 'high',
        message: `High risk: this sample address is one character different from ${similarHost} and asks for sign-in or contact details. Check the address and leave if you did not expect this page.`,
        demoHost,
        isBlacklisted: false,
      };
    }

    if (requestsSensitiveInfo && !trustedDemoHosts.includes(demoHost)) {
      return {
        level: 'caution',
        message: 'Caution: this unfamiliar sample page asks for sign-in or contact details. Check the address; this alone does not prove it is a scam.',
        demoHost,
        isBlacklisted: false,
      };
    }

    return {
      level: 'neutral',
      message: 'No demo warning signal was detected. This is not a guarantee that a page is safe.',
      demoHost,
      isBlacklisted: false,
    };
  }

  function publishPageRisk() {
    const assessed = assessPageRisk();
    const storage = chrome.storage && chrome.storage.local;
    const finish = (reportedHosts = []) => {
      pageRisk = assessed;
      if (reportedHosts.includes(assessed.demoHost)) {
        pageRisk = { ...assessed, level: 'high', isBlacklisted: true, message: `This site was reported as a demo scam link and is on your local block list: ${assessed.demoHost}.` };
      }
      pageRiskReady = true;
      renderSafetySignal(true);
      showPageRiskWarning();
      try {
        chrome.runtime.sendMessage({ type: 'WEB_SHIELD_PAGE_RISK', level: pageRisk.level }, () => { void chrome.runtime.lastError; });
      } catch (_error) { /* The page remains usable if the extension reloads. */ }
    };
    if (storage) {
      storage.get({ reportedScamHosts: [] }, (result) => {
        void chrome.runtime.lastError;
        finish(Array.isArray(result && result.reportedScamHosts) ? result.reportedScamHosts : []);
      });
    } else finish();
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
        .green { background: #188038; } .yellow { background: #f9ab00; color: #202124; } .red { background: #d93025; }
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
    const status = pageRisk.level === 'high' ? 'red' : pageRisk.level === 'caution' ? 'yellow' : 'green';
    button.className = `signal ${status}`;
    button.textContent = status === 'green' ? '✓' : '!';
    button.setAttribute('aria-label', `${status} safety signal. Click for explanation.`);
    bubble.textContent = pageRisk.message;
    if (showBriefly && status !== 'red') setExplanationVisible(true, true);
    else setExplanationVisible(false, false);
  }

  function saveReportedHost(callback) {
    const storage = chrome.storage && chrome.storage.local;
    if (!storage || !pageRisk.demoHost) { callback(false); return; }
    storage.get({ reportedScamHosts: [] }, (result) => {
      void chrome.runtime.lastError;
      const hosts = Array.isArray(result && result.reportedScamHosts) ? result.reportedScamHosts : [];
      if (!hosts.includes(pageRisk.demoHost)) hosts.push(pageRisk.demoHost);
      storage.set({ reportedScamHosts: hosts }, () => {
        const failed = Boolean(chrome.runtime.lastError);
        if (!failed) {
          pageRisk = { ...pageRisk, level: 'high', isBlacklisted: true, message: `This site is now on your local block list: ${pageRisk.demoHost}.` };
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
    feedback.textContent = 'Reported hostnames are saved only in this browser. No page contents or form values are sent.';
    const detail = document.createElement('p');
    detail.textContent = pageRisk.message;
    const report = makeButton('Report this site', () => {
      report.disabled = true;
      saveReportedHost((saved) => {
        feedback.textContent = saved ? `Reported. ${pageRisk.demoHost} is saved in this browser’s local block list.` : 'Could not save the report in this browser.';
        report.disabled = false;
      });
    });
    setPanelContent(
      'This page has a red safety signal. Leave if you did not expect this site.',
      [detail, feedback],
      [
        makeButton('Go back', () => {
          if (window.history.length > 1) window.history.back();
          else window.location.assign('site-warning.html');
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', publishPageRisk, { once: true });
  } else {
    publishPageRisk();
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && message.type === 'WEB_SHIELD_STATUS') {
      if (!pageRiskReady && document.body) publishPageRisk();
      sendResponse({
        active: true,
        scope: 'localhost sample pages only',
        level: pageRiskReady ? pageRisk.level : 'checking',
        message: pageRiskReady ? pageRisk.message : 'Page signal is still loading.',
      });
    }
  });
})();
