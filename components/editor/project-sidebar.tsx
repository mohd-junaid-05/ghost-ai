"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { ProjectRow } from "@/hooks/use-project-actions"

// ── Props ──────────────────────────────────────────────────────────────────

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: ProjectRow[]
  sharedProjects: ProjectRow[]
  activeProjectId?: string
  onNewProject: () => void
  onRenameProject: (project: ProjectRow) => void
  onDeleteProject: (project: ProjectRow) => void
  className?: string
  inline?: boolean
}

// ── Component ──────────────────────────────────────────────────────────────

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  activeProjectId,
  onNewProject,
  onRenameProject,
  onDeleteProject,
  className,
  inline = false,
}: ProjectSidebarProps) {
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement
    } else {
      if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus()
        previouslyFocusedElementRef.current = null
      }
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile backdrop scrim — closes sidebar on tap outside */}
      {isOpen && !inline && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel — floats above canvas or docks inline */}
      <aside
        id="project-sidebar"
        data-open={isOpen}
        className={cn(
          inline
            ? "relative flex h-full w-72 shrink-0 flex-col rounded-2xl border border-border-default bg-bg-surface overflow-hidden"
            : "fixed left-0 top-14 z-30 flex h-[calc(100dvh-3.5rem)] w-72 flex-col border-r border-border-default bg-bg-surface translate-x-0 transition-transform duration-300 ease-in-out",
          !inline && !isOpen && "-translate-x-full",
          className
        )}
        inert={!inline && !isOpen ? true : undefined}
      >
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border-default px-4">
          <span className="text-sm font-semibold text-text-primary">Projects</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close sidebar"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-1 flex-col overflow-hidden px-3 py-3">
          <Tabs defaultValue="my-projects" className="flex flex-1 flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="my-projects" className="flex-1">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1">
                Shared
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto">
              {ownedProjects.length === 0 ? (
                <EmptyPlaceholder label="No projects yet" />
              ) : (
                ownedProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    showActions
                    isActive={project.id === activeProjectId}
                    onRename={() => onRenameProject(project)}
                    onDelete={() => onDeleteProject(project)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="shared" className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto">
              {sharedProjects.length === 0 ? (
                <EmptyPlaceholder label="No shared projects" />
              ) : (
                sharedProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    showActions={false}
                    isActive={project.id === activeProjectId}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer — New Project button */}
        <div className="shrink-0 border-t border-border-default p-3">
          <Button
            id="sidebar-new-project"
            variant="default"
            className="w-full gap-2"
            aria-label="Create new project"
            onClick={onNewProject}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}

// ── Project Item ───────────────────────────────────────────────────────────

interface ProjectItemProps {
  project: ProjectRow
  showActions: boolean
  isActive?: boolean
  onRename?: () => void
  onDelete?: () => void
}

function ProjectItem({ project, showActions, isActive, onRename, onDelete }: ProjectItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-bg-subtle",
        isActive && "bg-bg-subtle"
      )}
    >
      <Link
        href={`/editor/${project.id}`}
        className="flex flex-1 items-center gap-2.5 truncate"
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            isActive ? "bg-accent-primary" : "bg-transparent"
          )}
        />

        <span
          className={cn(
            "flex-1 truncate text-sm",
            isActive ? "font-medium text-text-primary" : "text-text-secondary group-hover:text-text-primary"
          )}
        >
          {project.name}
        </span>
      </Link>

      {showActions && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Button
            id={`rename-${project.id}`}
            variant="ghost"
            size="icon"
            aria-label={`Rename ${project.name}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRename?.()
            }}
            className="h-6 w-6 text-text-muted hover:text-text-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            id={`delete-${project.id}`}
            variant="ghost"
            size="icon"
            aria-label={`Delete ${project.name}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete?.()
            }}
            className="h-6 w-6 text-text-muted hover:text-state-error"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Empty Placeholder ──────────────────────────────────────────────────────

function EmptyPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-default py-12 text-center">
      <span className="text-sm text-text-muted">{label}</span>
    </div>
  )
}
