"use client"

import { useRef, useState } from "react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import {
  CreateProjectDialog,
  DeleteProjectDialog,
  RenameProjectDialog,
} from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ProjectDialogsContext } from "@/contexts/project-dialogs-context"
import { useProjectDialogs } from "@/hooks/use-project-dialogs"

interface EditorShellProps {
  children?: React.ReactNode
}

export function EditorShell({ children }: EditorShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)

  const {
    projects,
    dialog,
    nameInput,
    setNameInput,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  } = useProjectDialogs()

  return (
    <ProjectDialogsContext.Provider value={{ openCreate }}>
      <div className="relative flex h-dvh flex-col overflow-hidden bg-bg-base">
        {/* Fixed top navbar */}
        <EditorNavbar
          isSidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen((prev) => !prev)}
          toggleRef={toggleButtonRef}
        />

        {/* Floating sidebar — slides in over the canvas, no layout shift */}
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => {
            setSidebarOpen(false)
            toggleButtonRef.current?.focus()
          }}
          projects={projects}
          onNewProject={openCreate}
          onRenameProject={openRename}
          onDeleteProject={openDelete}
        />

        {/* Main canvas area — sits below the navbar, fills remaining space */}
        <main className="mt-12 flex-1 overflow-auto">{children}</main>

        {/* ── Dialogs ─────────────────────────────────────────────────────── */}

        <CreateProjectDialog
          open={dialog.kind === "create"}
          onClose={closeDialog}
          isLoading={isLoading}
          name={nameInput}
          onNameChange={setNameInput}
          onSubmit={submitCreate}
        />

        <RenameProjectDialog
          open={dialog.kind === "rename"}
          onClose={closeDialog}
          isLoading={isLoading}
          currentName={dialog.project?.name ?? ""}
          name={nameInput}
          onNameChange={setNameInput}
          onSubmit={submitRename}
        />

        <DeleteProjectDialog
          open={dialog.kind === "delete"}
          onClose={closeDialog}
          isLoading={isLoading}
          projectName={dialog.project?.name ?? ""}
          onSubmit={submitDelete}
        />
      </div>
    </ProjectDialogsContext.Provider>
  )
}
