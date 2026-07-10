import { EditorShell } from "@/components/editor/editor-shell"

export const metadata = {
  title: "Editor — Ghost AI",
  description: "System design workspace.",
}

export default function EditorPage() {
  return (
    <EditorShell>
      {/* Canvas placeholder — replace with React Flow canvas in the next phase */}
      <div className="flex h-full items-center justify-center text-text-faint text-sm select-none">
        Canvas goes here
      </div>
    </EditorShell>
  )
}
