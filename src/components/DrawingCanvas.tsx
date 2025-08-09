"use client";

import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { AppState } from "@excalidraw/excalidraw/types/types";
import { useEffect, useState } from "react";

interface DrawingCanvasProps {
  initialData: string;
  onChange: (data: string) => void;
}

const DrawingCanvas = ({ initialData, onChange }: DrawingCanvasProps) => {
  const [elements, setElements] = useState<readonly ExcalidrawElement[]>([]);

  useEffect(() => {
    try {
        const parsedData = JSON.parse(initialData);
        if(parsedData.elements && Array.isArray(parsedData.elements)) {
            setElements(parsedData.elements);
        } else {
             setElements([]);
        }
    } catch(e) {
        console.error("Failed to parse initial drawing data", e);
        setElements([]);
    }
  }, [initialData]);

  const handleCanvasChange = (
    newElements: readonly ExcalidrawElement[],
    appState: AppState
  ) => {
    const drawingData = {
      elements: newElements,
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize,
      }
    };
    onChange(JSON.stringify(drawingData));
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Excalidraw
        theme="dark"
        initialData={{
          elements: elements,
        }}
        onChange={handleCanvasChange}
      />
    </div>
  );
};

export default DrawingCanvas;
