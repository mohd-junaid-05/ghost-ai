import { EditorShell } from "@/components/editor/editor-shell"
import { EditorHome } from "@/components/editor/editor-home"

export const metadata = {
  title: "Editor — Ghost AI",
  description: "System design workspace.",
}

export default function EditorPage() {
  return (
    <EditorShell>
      <EditorHome />
    </EditorShell>
  )
}
