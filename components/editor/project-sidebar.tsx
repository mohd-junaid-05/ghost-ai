"use client"

import { useEffect, useRef } from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function ProjectSidebar({
  isOpen,
  onClose,
  className,
}: ProjectSidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null)
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element (likely the toggle button)
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement
    } else {
      // When closing, return focus to the previously focused element
      if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus()
        previouslyFocusedElementRef.current = null
      }
    }
  }, [isOpen])

  return (
    <>
      {/* Sidebar panel — floats above canvas, does not push content */}
      <aside
        ref={sidebarRef}
        data-open={isOpen}
        className={cn(
          "fixed left-0 top-12 z-30 flex h-[calc(100dvh-3rem)] w-72 flex-col border-r border-border-default bg-bg-surface",
          "translate-x-0 transition-transform duration-300 ease-in-out",
          !isOpen && "-translate-x-full",
          className
        )}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border-default px-4">
          <span className="text-sm font-semibold text-text-primary">
            Projects
          </span>
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

            <TabsContent
              value="my-projects"
              className="mt-4 flex flex-1 flex-col"
            >
              <EmptyPlaceholder label="No projects yet" />
            </TabsContent>

            <TabsContent value="shared" className="mt-4 flex flex-1 flex-col">
              <EmptyPlaceholder label="No shared projects" />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer — New Project button */}
        <div className="shrink-0 border-t border-border-default p-3">
          <Button
            variant="default"
            className="w-full gap-2"
            aria-label="Create new project"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}

/* ── Internal helper ─────────────────────────────────────────────────────── */

function EmptyPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-default py-12 text-center">
      <span className="text-sm text-text-muted">{label}</span>
    </div>
  )
}
