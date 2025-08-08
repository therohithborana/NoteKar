
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: "toggle_panel"
    });
  }
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "_execute_action" && tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: "toggle_panel"
    });
  }
});
