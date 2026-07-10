"use client"

import { useRef, useState } from "react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"

interface EditorShellProps {
  children?: React.ReactNode
}

export function EditorShell({ children }: EditorShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)

  return (
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
      />

      {/* Main canvas area — sits below the navbar, fills remaining space */}
      <main className="mt-12 flex-1 overflow-auto">{children}</main>
    </div>
  )
}
