
"use client";

import { Tldraw, useEditor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useEffect } from 'react';

type TldrawCanvasProps = {
  initialData?: string;
  onSave: (data: string) => void;
};

// This is a new component that wraps the Tldraw editor
// to handle loading and saving data.
function EditorInner({ initialData, onSave }: TldrawCanvasProps) {
    const editor = useEditor();

    useEffect(() => {
        if (editor && initialData) {
            try {
                const snapshot = JSON.parse(initialData);
                 // Prevent loading empty state over existing drawings if parent state updates
                if (snapshot.shapes && snapshot.shapes.length > 0) {
                    editor.loadSnapshot(snapshot);
                }
            } catch (e) {
                console.error("Failed to load drawing data", e);
            }
        }
    }, [editor, initialData]);

    useEffect(() => {
        if (!editor) return;
        const handleChange = () => {
            const snapshot = editor.getSnapshot();
            onSave(JSON.stringify(snapshot));
        };
        // Using a timeout to debounce the save function
        const debouncedHandleChange = setTimeout(() => {
            editor.on('change', handleChange);
        }, 500);

        return () => {
            clearTimeout(debouncedHandleChange);
            editor.off('change', handleChange);
        };
    }, [editor, onSave]);

    return null;
}


export default function TldrawCanvas({ initialData, onSave }: TldrawCanvasProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Tldraw persistenceKey={`tldraw-note-${initialData}`} forceMobile={false} forceDarkMode={true}>
        <EditorInner initialData={initialData} onSave={onSave} />
      </Tldraw>
    </div>
  );
}
