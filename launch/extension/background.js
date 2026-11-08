const LOCAL_SCANNER_URL = 'http://127.0.0.1:8000/api/scan';

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});

function buildLookupUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only web pages can be checked.');

  // Drop query strings and fragments, and redact long token-like path segments
  // before the URL is sent to the reputation service.
  parsed.username = '';
  parsed.password = '';
  parsed.search = '';
  parsed.hash = '';
  const segments = parsed.pathname.split('/').map((segment) => {
    if (/^[a-z0-9_-]{16,}$/i.test(segment) || /^[a-f0-9-]{24,}$/i.test(segment)) return '[redacted]';
    return segment;
  });
  parsed.pathname = segments.join('/');
  return parsed.toString();
}

async function requestReputationCheck(pageUrl) {
  try {
    const lookupUrl = buildLookupUrl(pageUrl);
    const response = await fetch(LOCAL_SCANNER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ url: lookupUrl }),
      cache: 'no-store',
    });
    if (!response.ok) return { status: 'unavailable', message: 'The local reputation service is unavailable.' };
    return await response.json();
  } catch (_error) {
    return { status: 'unavailable', message: 'Start the local WebShield scanner to check URL reputation.' };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || sender.id !== chrome.runtime.id) return;

  if (message.type === 'WEB_SHIELD_LOOKUP_URL') {
    if (!sender.tab || typeof sender.tab.id !== 'number' || !sender.url) {
      sendResponse({ status: 'unavailable', message: 'Could not read this tab address.' });
      return false;
    }
    requestReputationCheck(sender.url).then(sendResponse);
    return true;
  }

  if (message.type === 'WEB_SHIELD_PAGE_RISK' && sender.tab && typeof sender.tab.id === 'number') {
    const tabId = sender.tab.id;
    const badgeByLevel = {
      neutral: { text: 'OK', color: '#188038' },
      caution: { text: 'CAU', color: '#f9ab00' },
      high: { text: 'RISK', color: '#d93025' },
      unknown: { text: '?', color: '#5f6368' },
    };
    const badge = badgeByLevel[message.level] || badgeByLevel.unknown;
    chrome.action.setBadgeText({ tabId, text: badge.text });
    chrome.action.setBadgeBackgroundColor({ tabId, color: badge.color });
    sendResponse({ ok: true });
    return false;
  }
});
