'use strict';

const APP_URL = "https://note-kar.vercel.app/";
let notesWindowId = null;

async function toggleNotesWindow() {
  if (notesWindowId !== null) {
    try {
      await chrome.windows.remove(notesWindowId);
      return;
    } catch (error) {
      notesWindowId = null;
    }
  }

  try {
    const [display] = await chrome.system.display.getInfo();
    const screenWidth = display.workArea.width;
    const windowWidth = 350;
    const left = screenWidth - windowWidth;

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

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === notesWindowId) {
    notesWindowId = null;
  }
});

chrome.action.onClicked.addListener(toggleNotesWindow);

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-notes") {
    await toggleNotesWindow();
  } else if (command === "create-new-note") {
    if (notesWindowId === null) {
      await toggleNotesWindow();
    }
    
    // Give the window a moment to open and load
    setTimeout(() => {
        chrome.runtime.sendMessage({ command: 'create-new-note' });
    }, 100);

    if (notesWindowId !== null) {
      chrome.windows.update(notesWindowId, { focused: true });
    }
  }
});

async function addNoteFromSelection(selectionText) {
    await chrome.storage.local.set({ newNoteContent: selectionText });
    if (notesWindowId === null) {
      await toggleNotesWindow();
    } else {
      chrome.windows.update(notesWindowId, { focused: true });
    }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addNote",
    title: "Add to Notes",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addNote" && info.selectionText) {
    addNoteFromSelection(info.selectionText);
  }
});
