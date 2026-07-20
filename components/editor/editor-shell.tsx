"use client"

import { useRef, useState } from "react"
import { Bot, Sparkles } from "lucide-react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { AiSidebar } from "@/components/editor/ai-sidebar"
import {
  CreateProjectDialog,
  DeleteProjectDialog,
  RenameProjectDialog,
} from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import { ProjectDialogsContext } from "@/contexts/project-dialogs-context"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { ProjectRow } from "@/hooks/use-project-actions"
import { cn } from "@/lib/utils"

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
  // If activeProjectId is set, default the left sidebar to open (true). Otherwise, closed (false).
  const [sidebarOpen, setSidebarOpen] = useState(!!activeProjectId)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)
  const aiToggleButtonRef = useRef<HTMLButtonElement>(null)

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
          isAiSidebarOpen={aiSidebarOpen}
          onAiSidebarToggle={() => setAiSidebarOpen((prev) => !prev)}
          onShareClick={() => setShareDialogOpen(true)}
          toggleRef={toggleButtonRef}
          aiToggleRef={aiToggleButtonRef}
          projectName={projectName}
        />

        {/* Layout container — fills the viewport below the navbar */}
        <div className="relative flex-1 overflow-hidden w-full h-full">
          {/* Main content/canvas area — fills screen edge-to-edge */}
          <main className="absolute inset-x-0 bottom-0 top-14 z-0 bg-bg-base">
            {children}
          </main>

          {/* Left Sidebar overlay */}
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

          {/* Right AI Copilot Sidebar overlay */}
          {activeProjectId && (
            <AiSidebar 
              isOpen={aiSidebarOpen} 
              onClose={() => {
                setAiSidebarOpen(false)
                aiToggleButtonRef.current?.focus()
              }} 
            />
          )}
        </div>

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

        <ShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          projectId={activeProjectId}
          isOwner={activeProject?.isOwned ?? false}
        />
      </div>
    </ProjectDialogsContext.Provider>
  )
}
