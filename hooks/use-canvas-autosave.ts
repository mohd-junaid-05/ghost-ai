import { useState, useEffect, useRef } from "react";
import { type CanvasNode, type CanvasEdge } from "@/types/canvas";

export type SaveStatus = "saved" | "saving" | "error";

interface UseCanvasAutosaveProps {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  debounceMs?: number;
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  debounceMs = 2000,
}: UseCanvasAutosaveProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const isFirstRender = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const saveStateRef = useRef({ nodes, edges, projectId });

  // Update ref on every render
  useEffect(() => {
    saveStateRef.current = { nodes, edges, projectId };
  }, [nodes, edges, projectId]);

  // Execute the save immediately
  const executeSave = async () => {
    const { nodes: currentNodes, edges: currentEdges, projectId: currentProjectId } = saveStateRef.current;
    
    try {
      setSaveStatus("saving");
      window.dispatchEvent(new CustomEvent("canvas-save-status", { detail: "saving" }));

      const response = await fetch(`/api/projects/${currentProjectId}/canvas`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nodes: currentNodes, edges: currentEdges }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setSaveStatus("saved");
      window.dispatchEvent(new CustomEvent("canvas-save-status", { detail: "saved" }));
    } catch (error) {
      console.error("Autosave error:", error);
      setSaveStatus("error");
      window.dispatchEvent(new CustomEvent("canvas-save-status", { detail: "error" }));
    }
  };

  // Autosave triggers on nodes/edges change
  useEffect(() => {
    // Skip saving on the initial mount when the hook is first rendered
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus("saving");
    window.dispatchEvent(new CustomEvent("canvas-save-status", { detail: "saving" }));

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      executeSave();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [projectId, nodes, edges, debounceMs]);

  // Listen for manual save triggers
  useEffect(() => {
    const handleManualSave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      executeSave();
    };

    window.addEventListener("trigger-canvas-save", handleManualSave);
    return () => {
      window.removeEventListener("trigger-canvas-save", handleManualSave);
    };
  }, []);

  return { saveStatus };
}
