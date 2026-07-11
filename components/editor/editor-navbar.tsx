"use client"

import { UserButton } from "@clerk/nextjs"
import { PanelLeftClose, PanelLeftOpen, PanelRight, Share } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onSidebarToggle: () => void
  toggleRef?: React.RefObject<HTMLButtonElement | null>
  projectName?: string
  className?: string
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
  toggleRef,
  projectName,
  className,
}: EditorNavbarProps) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between border-b border-border-default bg-bg-surface px-3",
        className
      )}
    >
      {/* Left section — sidebar toggle */}
      <div className="flex w-1/3 items-center">
        <Button
          ref={toggleRef}
          variant="ghost"
          size="icon"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
          aria-controls="project-sidebar"
          onClick={onSidebarToggle}
          className="text-text-secondary hover:text-text-primary"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Center section — project name */}
      <div className="flex w-1/3 items-center justify-center">
        {projectName && (
          <span className="truncate text-sm font-medium text-text-primary">
            {projectName}
          </span>
        )}
      </div>

      {/* Right section — actions and user menu */}
      <div className="flex w-1/3 items-center justify-end gap-2">
        {projectName && (
          <>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <Share className="h-4 w-4" />
              Share
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-text-secondary hover:text-text-primary"
              aria-label="Toggle AI sidebar"
            >
              <PanelRight className="h-5 w-5" />
            </Button>

            <div className="mx-1 h-4 w-px bg-border-default" />
          </>
        )}
        <UserButton />
      </div>
    </header>
  )
}
