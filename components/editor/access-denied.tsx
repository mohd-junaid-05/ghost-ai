import Link from "next/link"
import { Lock } from "lucide-react"

import { Button } from "@/components/ui/button"

export function AccessDenied() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-bg-base text-center text-text-primary">
      <Lock className="h-12 w-12 text-text-secondary" />
      <h1 className="text-xl font-medium">Access Denied</h1>
      <p className="text-sm text-text-secondary">
        You do not have permission to access this project, or it doesn't exist.
      </p>
      <Button render={<Link href="/editor" />} className="mt-4">
        Return to Editor
      </Button>
    </div>
  )
}
