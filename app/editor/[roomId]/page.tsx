import { Compass } from "lucide-react"

import { AccessDenied } from "@/components/editor/access-denied"
import { EditorShell } from "@/components/editor/editor-shell"
import { getUserProjects } from "@/lib/data/projects"
import { checkProjectAccess } from "@/lib/project-access"

interface WorkspacePageProps {
  params: Promise<{ roomId: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { roomId } = await params

  // Verify access
  const { hasAccess } = await checkProjectAccess(roomId)

  if (!hasAccess) {
    return <AccessDenied />
  }

  // Fetch projects for the sidebar
  const { owned, shared } = await getUserProjects()

  const ownedRows = owned.map((p) => ({ id: p.id, name: p.name, isOwned: true as const }))
  const sharedRows = shared.map((p) => ({ id: p.id, name: p.name, isOwned: false as const }))

  return (
    <EditorShell
      activeProjectId={roomId}
      ownedProjects={ownedRows}
      sharedProjects={sharedRows}
    >
      {/* Central canvas placeholder content */}
      <div className="flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent-primary bg-bg-surface/50 text-accent-primary shadow-lg shadow-accent-primary/5">
          <Compass className="h-8 w-8 animate-pulse" />
        </div>
        
        <span className="mt-6 text-xs font-semibold tracking-[0.2em] text-text-muted uppercase">
          Workspace Shell
        </span>
        
        <h2 className="mt-3 max-w-md text-2xl font-bold text-text-primary tracking-tight">
          Canvas and collaboration tooling land here next.
        </h2>
        
        <p className="mt-4 max-w-sm text-sm text-text-secondary leading-relaxed">
          This room is ready for the shared architecture canvas, durable AI workflows, and real-time presence. For now, the shell is wired with project context and navigation only.
        </p>
      </div>
    </EditorShell>
  )
}
