"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useProjectDialogsContext } from "@/contexts/project-dialogs-context"

/**
 * Editor home screen — shown when no project is open.
 * Reads openCreate from ProjectDialogsContext provided by EditorShell.
 */
export function EditorHome() {
  const { openCreate } = useProjectDialogsContext()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-semibold text-text-primary">
          Create a project or open an existing one
        </h1>
        <p className="max-w-sm text-sm text-text-secondary">
          Start a new architecture workspace, or choose a project from the sidebar.
        </p>
      </div>

      <Button
        id="editor-home-new-project"
        onClick={openCreate}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        New Project
      </Button>
    </div>
  )
}
