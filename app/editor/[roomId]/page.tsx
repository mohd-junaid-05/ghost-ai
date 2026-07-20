import { Compass } from "lucide-react"

import { AccessDenied } from "@/components/editor/access-denied"
import { EditorShell } from "@/components/editor/editor-shell"
import { CanvasWrapper } from "@/components/editor/canvas-wrapper"
import { BaseCanvas } from "@/components/editor/base-canvas"
import { getUserProjects } from "@/lib/data/projects"
import { checkProjectAccess } from "@/lib/project-access"

import { RoomProviderWrapper } from "@/components/editor/room-provider-wrapper"

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
    <RoomProviderWrapper roomId={roomId}>
      <EditorShell
        activeProjectId={roomId}
        ownedProjects={ownedRows}
        sharedProjects={sharedRows}
      >
        <CanvasWrapper roomId={roomId}>
          <BaseCanvas />
        </CanvasWrapper>
      </EditorShell>
    </RoomProviderWrapper>
  )
}
