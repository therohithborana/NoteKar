// background.js

// Context Menu for selected text
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-to-notes",
    title: "Add to Notes",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "add-to-notes" && info.selectionText) {
    const noteContent = info.selectionText;
    // Store the selected text and open the full app
    chrome.storage.local.set({ newNoteContent: noteContent }, () => {
      chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
    });
  }
});

// Hotkey command to open a new note
chrome.commands.onCommand.addListener((command) => {
  if (command === "new-note") {
    // Clear any previous contextual note content and open the full app
    chrome.storage.local.remove("newNoteContent", () => {
       chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
    });
  }
});
