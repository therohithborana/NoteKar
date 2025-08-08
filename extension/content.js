
'use strict';

(function() {
    // Prevent script from running multiple times on the same page
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

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
        } 
        
        // Always set the src to ensure it reloads and fetches the new note
        // This is important because the iframe might exist but be hidden
        iframe.src = APP_URL;
       
        isVisible = true;
        iframe.style.display = 'block';
    }


    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "toggle") {
            togglePanel();
            sendResponse({status: "toggled"});
        } else if (request.action === "addNote") {
            showPanelAndReload();
            sendResponse({status: "note added"});
        }
        return true; // Keep message channel open for async response
    });


    // --- Draggable Logic ---
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        element.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            // Prevents dragging from affecting text selection inside the iframe
            if (e.target !== element) {
                return;
            }
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
})();
