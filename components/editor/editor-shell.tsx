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
import { useProjectActions } from "@/hooks/use-project-actions"
import type { ProjectRow } from "@/hooks/use-project-actions"

// ── Props ───────────────────────────────────────────────────────────────────

interface EditorShellProps {
  children?: React.ReactNode
  ownedProjects: ProjectRow[]
  sharedProjects: ProjectRow[]
  /** The projectId of the currently open workspace, if any. */
  activeProjectId?: string
}

// ── Component ───────────────────────────────────────────────────────────────

export function EditorShell({
  children,
  ownedProjects,
  sharedProjects,
  activeProjectId,
}: EditorShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)

  const {
    dialog,
    nameInput,
    setNameInput,
    roomIdPreview,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  } = useProjectActions({ activeProjectId })

  // Merge owned + shared into the shape the sidebar expects
  const ownedRows: ProjectRow[] = ownedProjects.map((p) => ({
    ...p,
    isOwned: true,
  }))
  const sharedRows: ProjectRow[] = sharedProjects.map((p) => ({
    ...p,
    isOwned: false,
  }))

  // Find active project name
  const activeProject =
    ownedRows.find((p) => p.id === activeProjectId) ||
    sharedRows.find((p) => p.id === activeProjectId)
  const projectName = activeProject?.name

  return (
    <ProjectDialogsContext.Provider value={{ openCreate }}>
      <div className="relative flex h-dvh flex-col overflow-hidden bg-bg-base">
        {/* Fixed top navbar */}
        <EditorNavbar
          isSidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen((prev) => !prev)}
          toggleRef={toggleButtonRef}
          projectName={projectName}
        />

        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => {
            setSidebarOpen(false)
            toggleButtonRef.current?.focus()
          }}
          ownedProjects={ownedRows}
          sharedProjects={sharedRows}
          activeProjectId={activeProjectId}
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
          roomIdPreview={roomIdPreview}
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
