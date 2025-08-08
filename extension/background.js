'use strict';

const APP_URL = "https://note-kar.vercel.app/";

function openNotesWindow() {
  chrome.windows.create({
    url: APP_URL,
    type: 'popup',
    width: 400,
    height: 600
  });
}

// Handle the action click (clicking the extension icon)
chrome.action.onClicked.addListener(openNotesWindow);

// Handle the command (hotkey)
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-notes") {
    openNotesWindow();
  }
});

// Function to add a note from selected text
async function addNoteFromSelection(selectionText) {
    await chrome.storage.local.set({ newNoteContent: selectionText });
    openNotesWindow();
}

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
    addNoteFromSelection(info.selectionText);
  }
});
