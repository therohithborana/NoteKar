'use strict';

const APP_URL = "https://note-kar.vercel.app/";
let notesWindowId = null;

async function toggleNotesWindow() {
  const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

  // If the window exists, close it and clear the ID
  if (notesWindowId !== null) {
    try {
      await chrome.windows.remove(notesWindowId);
      notesWindowId = null;
      return;
    } catch (error) {
      // Window was likely closed manually, so just clear the ID
      notesWindowId = null;
    }
  }

  // If no window is open, create a new one
  const window = await chrome.windows.create({
    url: APP_URL,
    type: 'popup',
    width: 400,
    height: 600
  });
  notesWindowId = window.id;

  // When the popup is closed by the user, reset our window ID
  chrome.windows.onRemoved.addListener(function listener(windowId) {
    if (windowId === notesWindowId) {
      notesWindowId = null;
      chrome.windows.onRemoved.removeListener(listener); // Clean up the listener
    }
  });
}

// Handle the action click (clicking the extension icon)
chrome.action.onClicked.addListener(toggleNotesWindow);

// Handle the command (hotkey)
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-notes") {
    toggleNotesWindow();
  }
});

// Function to add a note from selected text
async function addNoteFromSelection(selectionText) {
    await chrome.storage.local.set({ newNoteContent: selectionText });
    toggleNotesWindow();
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
