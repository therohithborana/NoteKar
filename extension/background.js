'use strict';

// IMPORTANT: Replace this with your actual deployed app URL
const APP_URL = "https://note-kar.vercel.app/";

// Function to open the notes app in a new tab, now only used as a fallback or for context menu
function openNotesApp() {
  chrome.tabs.create({ url: APP_URL });
}

// Function to add a note from selected text
async function addNoteFromSelection(selectionText) {
    // Store the selected text in local storage for the app to pick up
    await chrome.storage.local.set({ newNoteContent: selectionText });
    openNotesApp();
}

// The action.onClicked is now handled by the popup, so this is not strictly needed
// but can be kept for the command.
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle-notes") {
    // This command will open the full page, which is a good complement to the popup
    openNotesApp();
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
  if (info.menuItemId === "addNote" && info.selectionText) {
    addNoteFromSelection(info.selectionText);
  }
});
