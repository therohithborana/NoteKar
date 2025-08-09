
"use client";

import { Tldraw, useEditor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useEffect } from 'react';

type TldrawCanvasProps = {
  persistenceKey: string;
  initialData?: string;
  onSave: (data: string) => void;
};

// This is a new component that wraps the Tldraw editor
// to handle loading and saving data.
function EditorInner({ initialData, onSave }: Pick<TldrawCanvasProps, 'initialData' | 'onSave'>) {
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
        let debounceTimer: NodeJS.Timeout;
        const debouncedHandleChange = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                handleChange();
            }, 500); 
        };

        editor.on('change', debouncedHandleChange);

        return () => {
            clearTimeout(debounceTimer);
            editor.off('change', debouncedHandleChange);
        };
    }, [editor, onSave]);

    return null;
}


export default function TldrawCanvas({ persistenceKey, initialData, onSave }: TldrawCanvasProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Tldraw persistenceKey={persistenceKey} forceMobile={false} forceDarkMode={true}>
        <EditorInner initialData={initialData} onSave={onSave} />
      </Tldraw>
    </div>
  );
}
