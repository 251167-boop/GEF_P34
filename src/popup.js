const statusNode = document.getElementById('status');

function showStatus(text, level) {
  statusNode.textContent = text;
  const colorByLevel = { neutral: '#5f6368', caution: '#f9ab00', high: '#d93025', checking: '#1a73e8' };
  document.querySelector('.status-dot').style.backgroundColor = colorByLevel[level] || '#5f6368';
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || typeof tab.id !== 'number') {
    showStatus('Open one of the local sample pages to use the demo.', 'neutral');
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: 'WEB_SHIELD_STATUS' }, (response) => {
    if (chrome.runtime.lastError || !response || response.active !== true) {
      showStatus('Not active on this page. Open a sample page served from localhost.', 'neutral');
      return;
    }
    showStatus(response.message || 'Local checks are active on this sample page.', response.level || 'neutral');
  });
});
