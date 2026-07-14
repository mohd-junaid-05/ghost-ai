"use client"

import { useRef, useState } from "react"
import { Bot, Sparkles } from "lucide-react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
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
          projectName={projectName}
        />

        {!activeProjectId ? (
          <>
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
            <main className="mt-14 flex-1 overflow-auto">{children}</main>
          </>
        ) : (
          /* Workspace layout — docked side-by-side bento panels */
          <div className="flex flex-1 gap-3 p-3 pt-[68px] overflow-hidden h-full">
            {sidebarOpen && (
              <ProjectSidebar
                isOpen={sidebarOpen}
                onClose={() => {
                  setSidebarOpen(false)
                  toggleButtonRef.current?.focus()
                }}
                inline
                ownedProjects={ownedRows}
                sharedProjects={sharedRows}
                activeProjectId={activeProjectId}
                onNewProject={openCreate}
                onRenameProject={openRename}
                onDeleteProject={openDelete}
              />
            )}

            {/* Central Canvas Container with custom grid styling */}
            <div
              className="flex flex-1 flex-col rounded-2xl border border-border-default bg-bg-canvas relative overflow-hidden"
              style={{
                backgroundImage: `
                  radial-gradient(circle at center, rgba(24, 24, 28, 0.4) 0%, rgba(8, 8, 9, 0.85) 100%),
                  linear-gradient(to right, rgba(42, 42, 48, 0.15) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(42, 42, 48, 0.15) 1px, transparent 1px)
                `,
                backgroundSize: '100% 100%, 20px 20px, 20px 20px',
              }}
            >
              <main className="flex-1 overflow-auto flex flex-col justify-center items-center">
                {children}
              </main>
            </div>

            {/* Right sidebar — AI Copilot placeholder panel */}
            {aiSidebarOpen && (
              <div className="w-80 shrink-0 rounded-2xl border border-border-default bg-bg-surface flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex h-12 shrink-0 items-center justify-between border-b border-border-default px-4">
                  <span className="text-sm font-semibold text-text-primary">AI Copilot</span>
                  <Sparkles className="h-4.5 w-4.5 text-accent-ai" />
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-4 p-4 overflow-y-auto">
                  {/* Chat surface pending */}
                  <div className="flex gap-3 rounded-xl border border-border-default bg-bg-elevated p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-subtle text-accent-ai">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-text-primary leading-tight">Chat surface pending</span>
                      <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
                        The toggle is wired. Messaging and generation are intentionally out of scope here.
                      </p>
                    </div>
                  </div>

                  {/* Future hooks */}
                  <div className="mt-auto rounded-xl border border-border-subtle bg-bg-elevated/40 p-4">
                    <span className="text-[10px] font-semibold tracking-wider text-text-muted uppercase">Future Hooks</span>
                    <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                      Prompt composer, run status, and architecture guidance will attach to this sidebar.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
