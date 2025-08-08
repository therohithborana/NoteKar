'use strict';

const APP_URL = "https://note-kar.vercel.app/";
let notesWindowId = null;

async function toggleNotesWindow() {
  // Get screen dimensions to position the window on the right
  const screenInfo = await new Promise(resolve => chrome.system.display.getInfo(resolve));
  const primaryDisplay = screenInfo.find(d => d.isPrimary) || screenInfo[0];
  const screenWidth = primaryDisplay.workArea.width;
  const windowWidth = 400;

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

  // If no window is open, create a new one positioned on the right
  const window = await chrome.windows.create({
    url: APP_URL,
    type: 'popup',
    width: windowWidth,
    height: 600,
    left: screenWidth - windowWidth,
    top: 0
  });
  notesWindowId = window.id;

  // When the popup is closed by the user, reset our window ID
  const listener = (windowId) => {
    if (windowId === notesWindowId) {
      notesWindowId = null;
      chrome.windows.onRemoved.removeListener(listener); // Clean up the listener
    }
  };
  chrome.windows.onRemoved.addListener(listener);
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
