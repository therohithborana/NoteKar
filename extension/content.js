
'use strict';

const APP_URL = "http://localhost:9002/";
const FRAME_ID = 'glass-pane-notes-iframe';

let iframe = null;
let isVisible = false;

function createPanel() {
    if (document.getElementById(FRAME_ID)) {
        return document.getElementById(FRAME_ID);
    }

    const frame = document.createElement('iframe');
    frame.id = FRAME_ID;
    frame.src = APP_URL;
    frame.style.display = 'none'; // Start hidden
    document.body.appendChild(frame);
    
    // Make it draggable
    makeDraggable(frame);

    return frame;
}

function togglePanel() {
    if (!iframe) {
        iframe = createPanel();
    }
    isVisible = !isVisible;
    iframe.style.display = isVisible ? 'block' : 'none';
}

function showPanelAndReload() {
     if (!iframe) {
        iframe = createPanel();
     } else {
        // Reload to fetch the new note from storage
        iframe.src = APP_URL;
     }
     isVisible = true;
     iframe.style.display = 'block';
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle") {
        togglePanel();
    } else if (request.action === "addNote") {
        showPanelAndReload();
    }
});


// --- Draggable Logic ---
function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    // Use a header div inside the iframe for dragging, or the whole iframe if not possible.
    // For simplicity, we'll make the whole iframe draggable, which requires some CSS changes.
    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
