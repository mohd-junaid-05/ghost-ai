"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

// ── Types ──────────────────────────────────────────────────────────────────

export interface ProjectRow {
  id: string
  name: string
  isOwned: boolean
}

type DialogKind = "create" | "rename" | "delete" | null

interface DialogState {
  kind: DialogKind
  /** Populated for rename/delete dialogs */
  project?: ProjectRow
}

// ── Slug helpers ────────────────────────────────────────────────────────────

export function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function shortSuffix(): string {
  return Math.random().toString(36).slice(2, 7)
}

function toRoomId(name: string): string {
  const base = toSlug(name) || "project"
  return `${base}-${shortSuffix()}`
}

// ── Hook ───────────────────────────────────────────────────────────────────

interface UseProjectActionsOptions {
  /** The projectId of the currently open workspace (if any). */
  activeProjectId?: string
}

export function useProjectActions(options: UseProjectActionsOptions = {}) {
  const { activeProjectId } = options
  const router = useRouter()

  const [dialog, setDialog] = useState<DialogState>({ kind: null })
  const [nameInput, setNameInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // ── Open helpers ──────────────────────────────────────────────────────────

  function openCreate() {
    setNameInput("")
    setDialog({ kind: "create" })
  }

  function openRename(project: ProjectRow) {
    setNameInput(project.name)
    setDialog({ kind: "rename", project })
  }

  function openDelete(project: ProjectRow) {
    setDialog({ kind: "delete", project })
  }

  function closeDialog() {
    setIsLoading(false)
    setDialog({ kind: null })
    setNameInput("")
  }

  // ── Submit handlers ───────────────────────────────────────────────────────

  async function submitCreate() {
    const trimmed = nameInput.trim()
    if (!trimmed) return

    const roomId = toRoomId(trimmed)
    setIsLoading(true)

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, roomId }),
      })

      if (!res.ok) throw new Error("Failed to create project")

      const data = (await res.json()) as { project: { id: string } }
      closeDialog()
      router.push(`/editor/${data.project.id}`)
    } catch (err) {
      console.error("createProject:", err)
      setIsLoading(false)
    }
  }

  async function submitRename() {
    const trimmed = nameInput.trim()
    if (!trimmed || !dialog.project) return

    setIsLoading(true)

    try {
      const res = await fetch(`/api/projects/${dialog.project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      })

      if (!res.ok) throw new Error("Failed to rename project")

      closeDialog()
      router.refresh()
    } catch (err) {
      console.error("renameProject:", err)
      setIsLoading(false)
    }
  }

  async function submitDelete() {
    if (!dialog.project) return

    const targetId = dialog.project.id
    setIsLoading(true)

    try {
      const res = await fetch(`/api/projects/${targetId}`, {
        method: "DELETE",
      })

      if (!res.ok && res.status !== 204) throw new Error("Failed to delete project")

      closeDialog()

      if (targetId === activeProjectId) {
        // Deleting the currently open workspace → go back to editor home
        router.push("/editor")
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error("deleteProject:", err)
      setIsLoading(false)
    }
  }

  // ── Room ID preview for the create dialog ─────────────────────────────────

  const roomIdPreview = nameInput.trim()
    ? toSlug(nameInput) || "project"
    : "my-project"

  return {
    // dialog state
    dialog,
    // form state
    nameInput,
    setNameInput,
    // derived
    roomIdPreview,
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
