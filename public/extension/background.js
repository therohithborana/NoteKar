
// Toggles the notes panel on the current tab
async function togglePanel(tab) {
  // Check if the content script is already injected and running
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: "toggleVisibility" });
    if (response && response.status === 'toggled') {
      // Content script is already active and has handled the toggle
      return;
    }
  } catch (e) {
    // This error means the content script is not injected yet, so we inject it.
    console.log("Glass Pane Notes: Injecting scripts.");
    
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["styles.css"],
    });

    // Inject scripts in order. db.js must be available for content.js
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["db.js"],
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
  }
}

// Listener for the extension icon click
chrome.action.onClicked.addListener((tab) => {
  togglePanel(tab);
});

// Listener for the keyboard shortcut
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle-notes") {
    togglePanel(tab);
  }
});
