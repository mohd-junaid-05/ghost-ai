"use client"

import { useEffect, useState } from "react"
import { Check, Link2, Loader2, Trash2, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  projectId?: string
  isOwner: boolean
}

interface Collaborator {
  id: string
  email: string
  name: string
  imageUrl: string
}

interface Owner {
  email: string
  name: string
  imageUrl: string
}

export function ShareDialog({ open, onClose, projectId, isOwner }: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [owner, setOwner] = useState<Owner | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // 1. Fetch collaborators when the dialog is opened
  async function fetchCollaborators() {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`)
      if (res.ok) {
        const body = await res.json()
        setCollaborators(body.collaborators || [])
        setOwner(body.owner || null)
      }
    } catch (err) {
      console.error("Failed to load collaborators:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && projectId) {
      fetchCollaborators()
      setInviteError(null)
      setEmailInput("")
    }
  }, [open, projectId])

  // 2. Invite collaborator by email
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!projectId || inviting || !emailInput.trim()) return

    setInviting(true)
    setInviteError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim() }),
      })

      const body = await res.json()

      if (!res.ok) {
        setInviteError(body.error || "Failed to invite collaborator")
      } else {
        setEmailInput("")
        fetchCollaborators()
      }
    } catch (err) {
      setInviteError("An unexpected error occurred")
      console.error(err)
    } finally {
      setInviting(false)
    }
  }

  // 3. Remove collaborator by email
  async function handleRemove(email: string) {
    if (!projectId) return

    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      )
      if (res.ok) {
        fetchCollaborators()
      } else {
        const body = await res.json()
        console.error("Failed to remove collaborator:", body.error)
      }
    } catch (err) {
      console.error("Failed to remove collaborator:", err)
    }
  }

  // 4. Copy URL link
  const projectUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/editor/${projectId}` 
    : ""

  async function handleCopy() {
    if (!projectUrl) return
    try {
      await navigator.clipboard.writeText(projectUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  function getInitials(name: string, email: string) {
    const stringToUse = name || email
    return stringToUse.slice(0, 2).toUpperCase()
  }

  const totalMembers = (owner ? 1 : 0) + collaborators.length

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl border border-border-default bg-bg-elevated sm:max-w-[480px] p-6" showCloseButton={true}>
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-xl font-semibold text-text-primary">Share project</DialogTitle>
          <DialogDescription className="text-xs text-text-secondary leading-normal">
            Invite collaborators, copy the workspace link, and manage access.
          </DialogDescription>
        </DialogHeader>

        {/* Divider */}
        <div className="h-px bg-border-default -mx-6 my-1" />

        <div className="flex flex-col gap-5 mt-2">
          {/* Workspace Link Card */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border-default bg-bg-surface/30 p-4">
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-text-primary">Workspace link</span>
              <span className="text-xs text-text-muted mt-1 leading-normal max-w-[260px]">
                Share a direct link with teammates after you grant them access.
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-9 gap-1.5 shrink-0 px-3.5 border-border-default bg-bg-base hover:bg-bg-subtle text-text-primary rounded-xl font-medium"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-state-success" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  <span>Copy link</span>
                </>
              )}
            </Button>
          </div>

          {/* Invite Section (Owners Only) */}
          {isOwner && (
            <form onSubmit={handleInvite} className="flex flex-col gap-2">
              <div className="relative flex items-center border border-border-default bg-bg-surface rounded-xl px-3 py-1.5 focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary">
                <Mail className="h-4 w-4 text-text-muted shrink-0 mr-2.5" />
                <input
                  type="email"
                  placeholder="teammate@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={inviting}
                  className="bg-transparent flex-1 text-sm text-text-primary focus:outline-none placeholder:text-text-muted min-w-0"
                />
                <Button
                  type="submit"
                  disabled={inviting || !emailInput.trim()}
                  className="h-7 px-3.5 bg-accent-primary text-black hover:bg-accent-primary/95 text-xs font-semibold rounded-lg shrink-0 ml-2"
                >
                  {inviting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Invite"}
                </Button>
              </div>
              {inviteError && (
                <p className="text-xs text-state-error mt-0.5 px-1">{inviteError}</p>
              )}
            </form>
          )}

          {/* People with Access Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">
                People with access
              </span>
              <span className="text-xs text-text-muted font-medium">
                {totalMembers} {totalMembers === 1 ? "total" : "total"}
              </span>
            </div>

            {loading ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : (
              <div className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
                {/* Owner Card */}
                {owner && (
                  <div className="flex items-center justify-between border border-border-default bg-bg-surface/30 rounded-2xl p-3 px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {owner.imageUrl ? (
                        <img
                          src={owner.imageUrl}
                          alt={owner.name || owner.email}
                          className="h-9 w-9 shrink-0 rounded-full border border-border-subtle bg-bg-subtle object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-subtle text-xs font-semibold text-text-secondary uppercase">
                          {getInitials(owner.name, owner.email)}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-sm font-semibold text-text-primary leading-tight">
                          {owner.name || owner.email}
                        </span>
                        {owner.name && (
                          <span className="truncate text-xs text-text-muted leading-tight mt-0.5">
                            {owner.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="rounded-md border border-accent-primary/20 bg-accent-primary-dim px-2.5 py-0.5 text-[9px] font-semibold tracking-wider text-accent-primary uppercase">
                      Owner
                    </span>
                  </div>
                )}

                {/* Collaborator Cards */}
                {collaborators.map((c) => (
                  <div key={c.id} className="flex items-center justify-between border border-border-default bg-bg-surface/30 rounded-2xl p-3 px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {c.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt={c.name || c.email}
                          className="h-9 w-9 shrink-0 rounded-full border border-border-subtle bg-bg-subtle object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-subtle text-xs font-semibold text-text-secondary uppercase">
                          {getInitials(c.name, c.email)}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-sm font-semibold text-text-primary leading-tight">
                          {c.name || c.email}
                        </span>
                        {c.name && (
                          <span className="truncate text-xs text-text-muted leading-tight mt-0.5">
                            {c.email}
                          </span>
                        )}
                      </div>
                    </div>
                    {isOwner ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(c.email)}
                        className="h-8 w-8 text-text-muted hover:text-state-error hover:bg-state-error/5 rounded-xl"
                        aria-label={`Remove ${c.email}`}
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    ) : (
                      <span className="rounded-md border border-border-subtle bg-bg-subtle px-2.5 py-0.5 text-[9px] font-semibold tracking-wider text-text-secondary uppercase">
                        Member
                      </span>
                    )}
                  </div>
                ))}

                {collaborators.length === 0 && !owner && (
                  <p className="text-xs text-text-muted py-2 text-center">
                    No collaborators invited yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
