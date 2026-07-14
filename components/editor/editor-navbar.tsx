"use client"

import { UserButton } from "@clerk/nextjs"
import { Ghost, PanelLeftClose, PanelLeftOpen, Share, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onSidebarToggle: () => void
  isAiSidebarOpen?: boolean
  onAiSidebarToggle?: () => void
  onShareClick?: () => void
  toggleRef?: React.RefObject<HTMLButtonElement | null>
  projectName?: string
  className?: string
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
  isAiSidebarOpen = false,
  onAiSidebarToggle,
  onShareClick,
  toggleRef,
  projectName,
  className,
}: EditorNavbarProps) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border-default bg-bg-surface px-4",
        className
      )}
    >
      {/* Left section — brand, project info, sidebar toggle */}
      <div className="flex items-center gap-3">
        <Button
          ref={toggleRef}
          variant="ghost"
          size="icon"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
          aria-controls="project-sidebar"
          onClick={onSidebarToggle}
          className="h-8 w-8 text-text-secondary hover:text-text-primary"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>

        {/* Brand/Project info container */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onSidebarToggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default bg-bg-elevated text-text-primary cursor-pointer hover:bg-bg-subtle transition-colors"
            title="Toggle Projects Sidebar"
            aria-label="Toggle Projects Sidebar"
          >
            <Ghost className="h-4.5 w-4.5" />
          </button>

          <div className="flex flex-col">
            <span className="max-w-[180px] sm:max-w-[280px] md:max-w-[400px] lg:max-w-[600px] truncate text-sm font-semibold text-text-primary leading-tight">
              {projectName || "Ghost AI"}
            </span>
            <span className="text-[10px] text-text-muted leading-none">
              Workspace
            </span>
          </div>
        </div>
      </div>

      {/* Center section — intentionally empty to allow left section to expand */}
      <div className="flex-1" />

      {/* Right section — actions and user menu */}
      <div className="flex items-center gap-3">
        {projectName && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onShareClick}
              className="h-8 gap-2 border-border-default text-text-secondary hover:text-text-primary"
            >
              <Share className="h-4 w-4" />
              Share
            </Button>

            <Button
              variant={isAiSidebarOpen ? "default" : "ghost"}
              size="sm"
              onClick={onAiSidebarToggle}
              className={cn(
                "h-8 gap-2 px-3",
                isAiSidebarOpen 
                  ? "bg-accent-primary text-black hover:bg-accent-primary/95" 
                  : "text-text-secondary hover:text-text-primary"
              )}
              aria-label="Toggle AI sidebar"
            >
              <Sparkles className="h-4 w-4" />
              AI
            </Button>

            <div className="h-4 w-px bg-border-default" />
          </>
        )}
        <UserButton />
      </div>
    </header>
  )
}
