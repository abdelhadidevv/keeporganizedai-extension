chrome.runtime.onInstalled.addListener(() => {
  console.log('KeepOrganizedAI extension installed');
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'pong' });
  }
  return true;
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-side-panel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id) {
        chrome.sidePanel.open({ tabId: tab.id });
        chrome.runtime.sendMessage({ type: 'FOCUS_SEARCH' });
      }
    });
  }
});
