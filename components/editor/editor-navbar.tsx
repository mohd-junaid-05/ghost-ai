"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onSidebarToggle: () => void
  className?: string
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
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
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
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

      {/* Center section — empty for now */}
      <div className="flex flex-1 items-center justify-center" />

      {/* Right section — empty for now */}
      <div className="flex items-center" />
    </header>
  )
}
