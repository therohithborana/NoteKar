'use strict';

document.getElementById('newNoteBtn').addEventListener('click', () => {
    chrome.storage.local.remove('newNoteContent', () => {
         chrome.tabs.create({ url: 'index.html' });
    });
});

document.getElementById('viewNotesBtn').addEventListener('click', () => {
    chrome.storage.local.remove('newNoteContent', () => {
        chrome.tabs.create({ url: 'index.html' });
    });
});
