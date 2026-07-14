import { EditorShell } from "@/components/editor/editor-shell"
import { EditorHome } from "@/components/editor/editor-home"
import { getUserProjects } from "@/lib/data/projects"

export const metadata = {
  title: "Editor — Ghost AI",
  description: "System design workspace.",
}

export default async function EditorPage() {
  const { owned, shared } = await getUserProjects()

  const ownedRows = owned.map((p) => ({ id: p.id, name: p.name, isOwned: true as const }))
  const sharedRows = shared.map((p) => ({ id: p.id, name: p.name, isOwned: false as const }))

  return (
    <EditorShell ownedProjects={ownedRows} sharedProjects={sharedRows}>
      <EditorHome />
    </EditorShell>
  )
}
