import { useEffect } from "react"
import { useReactFlow } from "@xyflow/react"

export function useKeyboardShortcuts(
  reactFlowInstance: ReturnType<typeof useReactFlow> | null,
  undo: () => void,
  redo: () => void
) {
  useEffect(() => {
    if (!reactFlowInstance) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an editable field
      const activeEl = document.activeElement as HTMLElement | null
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase()
        if (
          tagName === "input" ||
          tagName === "textarea" ||
          activeEl.isContentEditable
        ) {
          return
        }
      }

      const isMac =
        typeof window !== "undefined" &&
        navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey

      // Zoom in: "+" or "="
      if ((event.key === "+" || event.key === "=") && !ctrlKey) {
        event.preventDefault()
        reactFlowInstance.zoomIn({ duration: 200 })
      }
      // Zoom out: "-"
      else if (event.key === "-" && !ctrlKey) {
        event.preventDefault()
        reactFlowInstance.zoomOut({ duration: 200 })
      }
      // Undo: Ctrl/Cmd + Z
      else if (ctrlKey && event.key?.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault()
        undo()
      }
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      else if (
        (ctrlKey && event.key?.toLowerCase() === "z" && event.shiftKey) ||
        (ctrlKey && event.key?.toLowerCase() === "y")
      ) {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [reactFlowInstance, undo, redo])
}

export default useKeyboardShortcuts
