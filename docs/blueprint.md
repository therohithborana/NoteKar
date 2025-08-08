# **App Name**: Glass Pane Notes

## Core Features:

- Floating Notes Panel: Inject a draggable, resizable, semi-transparent notes panel overlay onto any webpage. The panel defaults to the top-right corner, 300px wide, 200px tall. Persist its position and size across sessions.
- Panel Toolbar: Include a toolbar with 'Hide/Show', a transparency slider, and 'Clear Notes' buttons for user customization of the floating panel. The slider will use CSS with rgba() or backdrop-filter: blur(5px) for a frosted glass effect with default transparency at 30%.
- Always Visible: Make the panel stay visible on screen while scrolling using 'position: fixed', while also keeping the panel above all page elements using a high z-index.
- Hotkey and Storage: Assign a global hotkey (e.g., Alt+N) to toggle panel visibility via the chrome.commands API. Store and persist user notes, panel position/size, and transparency level using IndexedDB for each domain separately. Autosave notes after every keystroke.

## Style Guidelines:

- Primary color: Soft purple (#A094C7) to bring a sophisticated, yet gentle presence to the overlay. Its subtlety prevents distraction while keeping the notes distinct.
- Background color: A very light purple (#F0EDF5), nearly white, but retains a hint of the primary color's hue. The background desaturation is at approximately 20%.
- Accent color: Muted blue (#75A1A8), providing a subtle contrast for interactive elements without overwhelming the primary focus on notes.
- Font: 'Inter', a sans-serif font to offer a clean, modern, and highly readable interface, suitable for both the header and the notes body. It will contribute to a distraction-free writing experience.
- Use minimal icons for the toolbar to maintain a distraction-free UI. Consider icons that subtly reflect the glassmorphism style (e.g., frosted or slightly blurred appearance).
- Ensure the panel is resizable from all corners and prevent it from going off-screen to provide a seamless user experience. Use word wrap for the text area to support multi-line notes.
- Use a subtle fade-in animation for when the panel appears, along with smooth transitions for transparency adjustments. This would enhance the glassmorphism aesthetic by giving the overlay a fluid, ethereal quality.