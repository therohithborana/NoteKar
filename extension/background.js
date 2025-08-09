'use strict';

const APP_URL = "https://6000-firebase-studio-1754676171861.cluster-ancjwrkgr5dvux4qug5rbzyc2y.cloudworkstations.dev/";
let notesWindowId = null;

async function toggleNotesWindow() {
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

  // Get screen dimensions to position the window on the right
  try {
    const screenInfo = await new Promise((resolve) => {
      if (chrome.system && chrome.system.display) {
        chrome.system.display.getInfo(resolve);
      } else {
        resolve(null); // Resolve with null if the API is not available
      }
    });
    
    const windowWidth = 400;
    let left = undefined;
    if (screenInfo && screenInfo.length > 0) {
      const primaryDisplay = screenInfo.find(d => d.isPrimary) || screenInfo[0];
      const screenWidth = primaryDisplay.workArea.width;
      left = screenWidth - windowWidth;
    }
    
    // If no window is open, create a new one positioned on the right
    const window = await chrome.windows.create({
      url: APP_URL,
      type: 'popup',
      width: windowWidth,
      height: 600,
      left: left,
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

  } catch (error) {
    console.error("Error creating notes window:", error);
  }
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
    if (notesWindowId === null) {
      toggleNotesWindow();
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
