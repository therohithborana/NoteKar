'use strict';

const APP_URL = "https://note-kar.vercel.app/";
let notesWindowId = null;

async function toggleNotesWindow() {
  // If the window exists, focus and close it.
  if (notesWindowId !== null) {
    try {
      await chrome.windows.remove(notesWindowId);
      // The onRemoved listener will handle setting notesWindowId to null.
      return;
    } catch (error) {
      // The window was likely already closed, so we'll just clear the ID
      // and proceed to create a new one.
      notesWindowId = null;
    }
  }

  // Get screen dimensions to position the window on the right
  try {
    const [display] = await chrome.system.display.getInfo();
    const screenWidth = display.workArea.width;
    const windowWidth = 350;
    const left = screenWidth - windowWidth;

    // If no window is open, create a new one.
    const window = await chrome.windows.create({
      url: APP_URL,
      type: 'popup',
      width: windowWidth,
      height: 600,
      left: left,
      top: 0
    });
    notesWindowId = window.id;

  } catch (error) {
    console.error("Error managing notes window:", error);
  }
}

// Listener for when a window is closed.
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === notesWindowId) {
    notesWindowId = null;
  }
});


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
    if (notesWindowId === null) {
      toggleNotesWindow();
    } else {
      // If window is open, focus it
      chrome.windows.update(notesWindowId, { focused: true });
    }
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
