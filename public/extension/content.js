
(function() {
    if (document.getElementById('glass-pane-notes-panel')) {
        return;
    }

    // --- STATE MANAGEMENT ---
    const state = {
        domain: window.location.hostname,
        text: '',
        x: window.innerWidth - 320,
        y: 20,
        width: 300,
        height: 200,
        transparency: 0.3,
        isBodyVisible: true,
        isVisible: true
    };
    
    // --- ICONS ---
    const ICONS = {
        hide: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
        show: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><path d="m2 2 20 20"/></svg>',
        clear: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
    };


    // --- DOM CREATION ---
    const panel = document.createElement('div');
    panel.id = 'glass-pane-notes-panel';

    function createPanel() {
        panel.innerHTML = `
            <div id="gpn-header">
                <div id="gpn-toolbar">
                    <button id="gpn-toggle-body-btn" title="Toggle Notes" class="gpn-toolbar-btn">${ICONS.hide}</button>
                    <input type="range" id="gpn-transparency-slider" min="0.1" max="1" step="0.05" title="Transparency">
                    <button id="gpn-clear-btn" title="Clear Notes" class="gpn-toolbar-btn">${ICONS.clear}</button>
                </div>
            </div>
            <div id="gpn-body">
                <textarea id="gpn-notes-textarea" placeholder="Your notes here..."></textarea>
            </div>
            <div class="gpn-resize-handle top-left"></div>
            <div class="gpn-resize-handle top-right"></div>
            <div class="gpn-resize-handle bottom-left"></div>
            <div class="gpn-resize-handle bottom-right"></div>
            <div class="gpn-resize-handle top"></div>
            <div class="gpn-resize-handle right"></div>
            <div class="gpn-resize-handle bottom"></div>
            <div class="gpn-resize-handle left"></div>
        `;
        document.body.appendChild(panel);
    }
    
    // --- DB & STATE SYNC ---
    async function loadState() {
        const data = await getNoteData(state.domain);
        if (data) {
            Object.assign(state, data);
        }
        applyState();
    }

    function applyState() {
        panel.style.left = `${state.x}px`;
        panel.style.top = `${state.y}px`;
        panel.style.width = `${state.width}px`;
        panel.style.height = `${state.height}px`;

        const baseColor = '240, 237, 245';
        panel.style.backgroundColor = `rgba(${baseColor}, ${state.transparency})`;
        document.getElementById('gpn-transparency-slider').value = state.transparency;
        
        document.getElementById('gpn-notes-textarea').value = state.text;
        
        updateBodyVisibility();
        updatePanelVisibility();
    }
    
    let saveTimeout;
    function scheduleSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => saveNoteData(state), 300);
    }

    // --- UI UPDATES ---
    function updateBodyVisibility() {
        const body = document.getElementById('gpn-body');
        const toggleBtn = document.getElementById('gpn-toggle-body-btn');
        if (state.isBodyVisible) {
            body.classList.remove('collapsed');
            toggleBtn.innerHTML = ICONS.hide;
            panel.style.height = `${state.height}px`;
        } else {
            body.classList.add('collapsed');
            toggleBtn.innerHTML = ICONS.show;
            panel.style.height = '36px'; // Header height
        }
    }

    function updatePanelVisibility() {
        if(state.isVisible) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    }


    // --- EVENT HANDLERS ---
    function setupEventListeners() {
        const header = document.getElementById('gpn-header');
        const textarea = document.getElementById('gpn-notes-textarea');
        const slider = document.getElementById('gpn-transparency-slider');
        const clearBtn = document.getElementById('gpn-clear-btn');
        const toggleBodyBtn = document.getElementById('gpn-toggle-body-btn');

        // Dragging
        header.addEventListener('mousedown', e => {
            if (e.target.closest('.gpn-toolbar-btn, #gpn-transparency-slider')) return;
            e.preventDefault();
            const startX = e.clientX;
            const startY = e.clientY;

            function onMouseMove(e) {
                let newX = state.x + e.clientX - startX;
                let newY = state.y + e.clientY - startY;

                // Boundary checks
                newX = Math.max(0, Math.min(newX, window.innerWidth - state.width));
                newY = Math.max(0, Math.min(newY, window.innerHeight - state.height));
                
                panel.style.left = `${newX}px`;
                panel.style.top = `${newY}px`;
            }

            function onMouseUp(e) {
                state.x = panel.offsetLeft;
                state.y = panel.offsetTop;
                scheduleSave();
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            }
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
        
        // Resizing
        panel.querySelectorAll('.gpn-resize-handle').forEach(handle => {
            handle.addEventListener('mousedown', e => {
                e.preventDefault();
                const startX = e.clientX;
                const startY = e.clientY;
                const startWidth = state.width;
                const startHeight = state.height;
                const startLeft = state.x;
                const startTop = state.y;
                const handleClasses = e.target.classList;

                function onMouseMove(e) {
                    const dx = e.clientX - startX;
                    const dy = e.clientY - startY;

                    if (handleClasses.contains('right')) state.width = Math.max(200, startWidth + dx);
                    if (handleClasses.contains('bottom')) state.height = Math.max(100, startHeight + dy);
                    if (handleClasses.contains('left')) {
                        state.width = Math.max(200, startWidth - dx);
                        state.x = startLeft + dx;
                    }
                    if (handleClasses.contains('top')) {
                        state.height = Math.max(100, startHeight - dy);
                        state.y = startTop + dy;
                    }

                    // Boundary checks
                    if (state.x < 0) {
                        state.width += state.x;
                        state.x = 0;
                    }
                    if (state.y < 0) {
                        state.height += state.y;
                        state.y = 0;
                    }
                    if (state.x + state.width > window.innerWidth) state.width = window.innerWidth - state.x;
                    if (state.y + state.height > window.innerHeight) state.height = window.innerHeight - state.y;
                    
                    panel.style.width = `${state.width}px`;
                    panel.style.height = `${state.height}px`;
                    panel.style.left = `${state.x}px`;
                    panel.style.top = `${state.y}px`;
                }
                
                function onMouseUp(e) {
                    scheduleSave();
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                }

                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });
        });

        // Toolbar actions
        textarea.addEventListener('input', e => {
            state.text = e.target.value;
            scheduleSave();
        });

        slider.addEventListener('input', e => {
            state.transparency = e.target.value;
            const baseColor = '240, 237, 245';
            panel.style.backgroundColor = `rgba(${baseColor}, ${state.transparency})`;
            scheduleSave();
        });

        clearBtn.addEventListener('click', () => {
            textarea.value = '';
            state.text = '';
            scheduleSave();
        });
        
        toggleBodyBtn.addEventListener('click', () => {
            state.isBodyVisible = !state.isBodyVisible;
            updateBodyVisibility();
            scheduleSave();
        });
    }
    
    // --- MESSAGE LISTENER ---
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "toggleVisibility") {
            state.isVisible = !state.isVisible;
            updatePanelVisibility();
            // Don't save visibility state, it's ephemeral
            sendResponse({status: "toggled"});
        }
        return true;
    });

    // --- INITIALIZATION ---
    function init() {
        createPanel();
        loadState();
        setupEventListeners();
    }

    init();
})();
