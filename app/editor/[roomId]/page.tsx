import { redirect } from "next/navigation"

import { AccessDenied } from "@/components/editor/access-denied"
import { EditorShell } from "@/components/editor/editor-shell"
import { getUserProjects } from "@/lib/data/projects"
import { checkProjectAccess } from "@/lib/project-access"

interface WorkspacePageProps {
  params: Promise<{
    roomId: string
  }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { roomId } = await params

  // Verify access
  const access = await checkProjectAccess(roomId)

  // Wait, if no identity, getIdentity returns null, but we'd rather redirect to /sign-in?
  // Let's rely on middleware for /sign-in. The middleware should protect /editor(.*).
  // If we reach here and have no access, we show AccessDenied.
  if (!access.hasAccess) {
    return <AccessDenied />
  }

  // Fetch all projects for the sidebar
  const { owned, shared } = await getUserProjects()

  const ownedRows = owned.map((p) => ({ id: p.id, name: p.name, isOwned: true as const }))
  const sharedRows = shared.map((p) => ({ id: p.id, name: p.name, isOwned: false as const }))

  return (
    <EditorShell
      activeProjectId={roomId}
      ownedProjects={ownedRows}
      sharedProjects={sharedRows}
    >
      <div className="flex h-full w-full bg-bg-canvas">
        {/* Central canvas placeholder */}
        <div className="flex flex-1 items-center justify-center">
          <div className="rounded-xl border border-border-default bg-bg-surface px-8 py-4 text-center shadow-sm">
            <h2 className="text-lg font-medium text-text-primary">
              Canvas Placeholder
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Real canvas logic coming soon
            </p>
          </div>
        </div>

        {/* Right sidebar placeholder for AI chat */}
        <div className="w-80 shrink-0 border-l border-border-default bg-bg-surface">
          <div className="flex h-full items-center justify-center p-4 text-center">
            <p className="text-sm text-text-secondary">AI Chat Placeholder</p>
          </div>
        </div>
      </div>
    </EditorShell>
  )
}
