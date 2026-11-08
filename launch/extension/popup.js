const statusNode = document.getElementById('status');
const scanButton = document.getElementById('scan-page');
const dot = document.querySelector('.status-dot');

function showStatus(text, level = 'unknown') {
  statusNode.textContent = text;
  const colorByLevel = {
    neutral: '#188038',
    caution: '#f9ab00',
    high: '#d93025',
    unknown: '#5f6368',
    checking: '#1a73e8',
  };
  dot.style.backgroundColor = colorByLevel[level] || colorByLevel.unknown;
}

function scanTab(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'WEB_SHIELD_SCAN_NOW' }, (response) => {
      const error = chrome.runtime.lastError;
      resolve(error ? { error: error.message } : response || { error: 'The page did not return a scan result.' });
    });
  });
}

scanButton.addEventListener('click', async () => {
  scanButton.disabled = true;
  showStatus('Checking page signals and URL reputation…', 'checking');
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs && tabs[0];
    if (!tab || typeof tab.id !== 'number' || !tab.url) {
      showStatus('Open an HTTP or HTTPS website, then scan again.', 'unknown');
      return;
    }
    const pageUrl = new URL(tab.url);
    if (!['http:', 'https:'].includes(pageUrl.protocol)) {
      showStatus('Chrome does not allow page scanning on this browser screen.', 'unknown');
      return;
    }

    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    const result = await scanTab(tab.id);
    if (result.error) {
      showStatus('Could not scan this tab. Refresh the page and try again.', 'unknown');
      return;
    }
    showStatus(result.message || 'Scan finished. Review the page signal.', result.level || 'unknown');
  } catch (_error) {
    showStatus('Chrome could not access this page. Try a regular HTTP or HTTPS tab.', 'unknown');
  } finally {
    scanButton.disabled = false;
  }
});
