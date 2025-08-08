'use strict';

const APP_URL = "http://localhost:9002/";

// Context Menu Creation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addNote",
    title: "Add to Notes",
    contexts: ["selection"]
  });
});

// Listener for context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addNote" && info.selectionText) {
    // Save the selected text to storage
    chrome.storage.local.set({ newNoteContent: info.selectionText }, () => {
      // Open the main app in a new tab
      chrome.tabs.create({ url: APP_URL });
    });
  }
});

// Listener for keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-new-note") {
     // Clear any previous selection and open the main app
    chrome.storage.local.remove("newNoteContent", () => {
        chrome.tabs.create({ url: APP_URL });
    });
  }
});
