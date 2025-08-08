
let panelVisible = false;
let panel = null;

function createPanel() {
  if (panel) return;

  panel = document.createElement('div');
  panel.id = 'glass-pane-notes-panel';
  panel.style.display = 'none';

  const header = document.createElement('div');
  header.id = 'glass-pane-notes-header';
  header.textContent = 'Glass Pane Notes (Drag Me)';
  panel.appendChild(header);

  const textarea = document.createElement('textarea');
  textarea.id = 'glass-pane-notes-textarea';
  textarea.placeholder = 'Your thoughts, captured seamlessly...';
  panel.appendChild(textarea);
  
  const footer = document.createElement('div');
  footer.id = 'glass-pane-notes-footer';
  
  const opacityLabel = document.createElement('label');
  opacityLabel.textContent = 'Opacity:';
  opacityLabel.setAttribute('for', 'glass-pane-opacity-slider');
  
  const opacitySlider = document.createElement('input');
  opacitySlider.type = 'range';
  opacitySlider.id = 'glass-pane-opacity-slider';
  opacitySlider.min = '0.1';
  opacitySlider.max = '1';
  opacitySlider.step = '0.05';
  opacitySlider.value = '0.8';

  footer.appendChild(opacityLabel);
  footer.appendChild(opacitySlider);
  panel.appendChild(footer);

  document.body.appendChild(panel);

  loadState();

  // Event Listeners
  textarea.addEventListener('input', saveNote);
  opacitySlider.addEventListener('input', (e) => {
      const newOpacity = e.target.value;
      panel.style.setProperty('--panel-opacity', newOpacity);
      saveState();
  });
  makeDraggable(panel, header);
}

function togglePanel() {
  if (!panel) createPanel();
  
  panelVisible = !panelVisible;
  panel.style.display = panelVisible ? 'flex' : 'none';
  if (panelVisible) {
      document.getElementById('glass-pane-notes-textarea').focus();
  }
}

function getStorageKey() {
  return `glass_pane_notes_${window.location.hostname}`;
}

function saveNote() {
    const noteContent = document.getElementById('glass-pane-notes-textarea').value;
    const key = getStorageKey();
    chrome.storage.local.set({ [key]: noteContent });
}

function saveState() {
  if (!panel) return;
  const state = {
    top: panel.style.top,
    left: panel.style.left,
    width: panel.style.width,
    height: panel.style.height,
    opacity: panel.style.getPropertyValue('--panel-opacity') || '0.8',
  };
  chrome.storage.local.set({ 'glass_pane_state': state });
}


function loadState() {
    const key = getStorageKey();
    chrome.storage.local.get([key, 'glass_pane_state'], (result) => {
        if (result[key]) {
            document.getElementById('glass-pane-notes-textarea').value = result[key];
        }
        if (result.glass_pane_state) {
            const state = result.glass_pane_state;
            panel.style.top = state.top || '20px';
            panel.style.left = state.left || '20px';
            panel.style.width = state.width || '350px';
            panel.style.height = state.height || '400px';
            panel.style.setProperty('--panel-opacity', state.opacity || '0.8');
            document.getElementById('glass-pane-opacity-slider').value = state.opacity || '0.8';
        }
    });
}


function makeDraggable(element, header) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  header.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
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
    saveState();
  }
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "toggle_panel") {
    togglePanel();
  }
});

// Create panel on load but keep it hidden
createPanel();
