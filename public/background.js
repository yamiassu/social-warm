// The panel exists only for tabs where the toolbar button was clicked (no global default_path), so it never shows on other tabs.
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.setOptions({ tabId: tab.id, path: 'sidepanel.html', enabled: true });
  chrome.sidePanel.open({ tabId: tab.id });
});
