
'use strict';

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

// Injects and executes the content script to toggle the panel
async function togglePanel(tab) {
  if (!tab || !tab.id || tab.url?.startsWith("chrome://")) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content.css']
    });
    await chrome.tabs.sendMessage(tab.id, { action: "toggle" });
  } catch (e) {
    console.error("Failed to toggle panel:", e);
  }
}

// Injects and executes the content script to add a note
async function addNoteAndShowPanel(tab, noteContent) {
    if (!tab || !tab.id || tab.url?.startsWith("chrome://")) return;

    try {
        await chrome.storage.local.set({ newNoteContent: noteContent });
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });
        await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['content.css']
        });
        await chrome.tabs.sendMessage(tab.id, { action: "addNote" });
    } catch(e) {
        console.error("Failed to add note:", e);
    }
}


// Listener for the extension icon click
chrome.action.onClicked.addListener(async (tab) => {
    togglePanel(tab);
});

// Listener for keyboard shortcut
chrome.commands.onCommand.addListener(async (command, tab) => {
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
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "addNote" && info.selectionText) {
    addNoteAndShowPanel(tab, info.selectionText);
  }
});
