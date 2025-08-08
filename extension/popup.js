'use strict';

const APP_URL = "http://localhost:9002/";

document.getElementById('newNoteBtn').addEventListener('click', () => {
    chrome.storage.local.remove('newNoteContent', () => {
         chrome.tabs.create({ url: APP_URL });
    });
});

document.getElementById('viewNotesBtn').addEventListener('click', () => {
    chrome.storage.local.remove('newNoteContent', () => {
        chrome.tabs.create({ url: APP_URL });
    });
});
