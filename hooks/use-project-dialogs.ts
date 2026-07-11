"use client"

import { useRef, useState } from "react"

// ── Types ──────────────────────────────────────────────────────────────────

export interface MockProject {
  id: string
  name: string
  slug: string
  isOwned: boolean
}

type DialogKind = "create" | "rename" | "delete" | null

interface DialogState {
  kind: DialogKind
  /** Populated for rename/delete dialogs */
  project?: MockProject
}

// ── Mock data ──────────────────────────────────────────────────────────────

const INITIAL_PROJECTS: MockProject[] = [
  { id: "1", name: "E-Commerce Platform", slug: "e-commerce-platform", isOwned: true },
  { id: "2", name: "Auth Service", slug: "auth-service", isOwned: true },
  { id: "3", name: "Shared API Gateway", slug: "shared-api-gateway", isOwned: false },
]

// ── Slug helper ────────────────────────────────────────────────────────────

export function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useProjectDialogs() {
  const [projects, setProjects] = useState<MockProject[]>(INITIAL_PROJECTS)
  const [dialog, setDialog] = useState<DialogState>({ kind: null })
  const [nameInput, setNameInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  /** Tracks the pending 400 ms timeout so it can be cancelled on early close */
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Open helpers ─────────────────────────────────────────────────────────

  function openCreate() {
    setNameInput("")
    setDialog({ kind: "create" })
  }

  function openRename(project: MockProject) {
    setNameInput(project.name)
    setDialog({ kind: "rename", project })
  }

  function openDelete(project: MockProject) {
    setDialog({ kind: "delete", project })
  }

  function closeDialog() {
    // Cancel any in-flight mock-async timer before resetting state
    if (pendingTimerRef.current !== null) {
      clearTimeout(pendingTimerRef.current)
      pendingTimerRef.current = null
    }
    setIsLoading(false)
    setDialog({ kind: null })
    setNameInput("")
  }

  // ── Submit handlers ───────────────────────────────────────────────────────

  function submitCreate() {
    if (!nameInput.trim()) return
    setIsLoading(true)
    // Simulate async — no real API yet
    pendingTimerRef.current = setTimeout(() => {
      pendingTimerRef.current = null
      const slug = toSlug(nameInput)
      setProjects((prev) => [
        ...prev,
        { id: Date.now().toString(), name: nameInput.trim(), slug, isOwned: true },
      ])
      setIsLoading(false)
      closeDialog()
    }, 400)
  }

  function submitRename() {
    if (!nameInput.trim() || !dialog.project) return
    setIsLoading(true)
    pendingTimerRef.current = setTimeout(() => {
      pendingTimerRef.current = null
      setProjects((prev) =>
        prev.map((p) =>
          p.id === dialog.project!.id
            ? { ...p, name: nameInput.trim(), slug: toSlug(nameInput) }
            : p
        )
      )
      setIsLoading(false)
      closeDialog()
    }, 400)
  }

  function submitDelete() {
    if (!dialog.project) return
    setIsLoading(true)
    pendingTimerRef.current = setTimeout(() => {
      pendingTimerRef.current = null
      setProjects((prev) => prev.filter((p) => p.id !== dialog.project!.id))
      setIsLoading(false)
      closeDialog()
    }, 400)
  }

  return {
    // data
    projects,
    // dialog state
    dialog,
    // form state
    nameInput,
    setNameInput,
    // loading
    isLoading,
    // actions
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  }
}
