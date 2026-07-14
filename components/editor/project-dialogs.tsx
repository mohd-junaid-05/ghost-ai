"use client"

import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

// ── Shared prop types ──────────────────────────────────────────────────────

interface BaseDialogProps {
  open: boolean
  onClose: () => void
  isLoading: boolean
}

// ── Create Project Dialog ──────────────────────────────────────────────────

interface CreateProjectDialogProps extends BaseDialogProps {
  name: string
  onNameChange: (v: string) => void
  /** Pre-computed room ID preview string from the hook */
  roomIdPreview: string
  onSubmit: () => void
}

export function CreateProjectDialog({
  open,
  onClose,
  isLoading,
  name,
  onNameChange,
  roomIdPreview,
  onSubmit,
}: CreateProjectDialogProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="rounded-3xl border-border-default bg-bg-elevated sm:max-w-md"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-text-primary">New Project</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Give your architecture workspace a name.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          <Input
            id="create-project-name"
            autoFocus
            placeholder="Project name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9 bg-bg-subtle"
          />
          {/* Live room ID preview */}
          <p className="text-xs text-text-muted">
            Room ID:{" "}
            <span className="font-mono text-text-secondary">{roomIdPreview}</span>
          </p>
        </div>

        <DialogFooter>
          <Button
            id="create-project-cancel"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-border-default text-text-secondary hover:text-text-primary"
          >
            Cancel
          </Button>
          <Button
            id="create-project-submit"
            onClick={onSubmit}
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Rename Project Dialog ──────────────────────────────────────────────────

interface RenameProjectDialogProps extends BaseDialogProps {
  currentName: string
  name: string
  onNameChange: (v: string) => void
  onSubmit: () => void
}

export function RenameProjectDialog({
  open,
  onClose,
  isLoading,
  currentName,
  name,
  onNameChange,
  onSubmit,
}: RenameProjectDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      // Slight delay so dialog is rendered before focusing
      const id = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="rounded-3xl border-border-default bg-bg-elevated sm:max-w-md"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-text-primary">Rename Project</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Renaming{" "}
            <span className="font-medium text-text-primary">{currentName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-1">
          <Input
            id="rename-project-name"
            ref={inputRef}
            placeholder="New name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9 bg-bg-subtle"
          />
        </div>

        <DialogFooter>
          <Button
            id="rename-project-cancel"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-border-default text-text-secondary hover:text-text-primary"
          >
            Cancel
          </Button>
          <Button
            id="rename-project-submit"
            onClick={onSubmit}
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Project Dialog ──────────────────────────────────────────────────

interface DeleteProjectDialogProps extends BaseDialogProps {
  projectName: string
  onSubmit: () => void
}

export function DeleteProjectDialog({
  open,
  onClose,
  isLoading,
  projectName,
  onSubmit,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="rounded-3xl border-border-default bg-bg-elevated sm:max-w-md"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-text-primary">Delete Project</DialogTitle>
          <DialogDescription className="text-text-secondary">
            This will permanently delete{" "}
            <span className="font-medium text-text-primary">{projectName}</span>. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            id="delete-project-cancel"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-border-default text-text-secondary hover:text-text-primary"
          >
            Cancel
          </Button>
          <Button
            id="delete-project-confirm"
            variant="destructive"
            onClick={onSubmit}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
