// popup.js
document.getElementById('new-note-btn').addEventListener('click', () => {
    // When creating a new note from the popup, ensure there's no leftover content
    chrome.storage.local.remove("newNoteContent", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
        window.close();
    });
});

document.getElementById('full-view-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    window.close();
});
