
'use strict';

const APP_URL = "http://localhost:9002/";

// Toggle the notes panel visibility
function togglePanel(tab) {
  // Prevent running on unsupported pages, like chrome://extensions
  if (tab.url?.startsWith("chrome://")) return;

  try {
    if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "toggle" });
    }
  } catch (e) {
    console.error("Could not send message to content script:", e);
  }
}

// Listener for the extension icon click
chrome.action.onClicked.addListener(togglePanel);

// Listener for keyboard shortcut
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle-notes") {
    togglePanel(tab);
  }
});


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
   // Prevent running on unsupported pages
  if (tab.url?.startsWith("chrome://")) return;

  if (info.menuItemId === "addNote" && info.selectionText) {
    // Save the selected text to storage
    chrome.storage.local.set({ newNoteContent: info.selectionText }, () => {
       if (tab && tab.id) {
         // Send a message to the content script to show the panel and handle the new note
         chrome.tabs.sendMessage(tab.id, { action: "addNote" });
       }
    });
  }
});
