// The initial neutral badge marks this as a local demo; it does not rate the page.
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: 'LOC' });
  chrome.action.setBadgeBackgroundColor({ color: '#5f6368' });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== 'WEB_SHIELD_PAGE_RISK' || !sender.tab || typeof sender.tab.id !== 'number') return;

  const tabId = sender.tab.id;
  const badgeByLevel = {
    neutral: { text: 'LOC', color: '#5f6368' },
    caution: { text: 'CAU', color: '#f9ab00' },
    high: { text: 'RISK', color: '#d93025' },
  };
  const badge = badgeByLevel[message.level] || badgeByLevel.neutral;
  chrome.action.setBadgeText({ tabId, text: badge.text });
  chrome.action.setBadgeBackgroundColor({ tabId, color: badge.color });
  sendResponse({ ok: true });
  return false;
});
