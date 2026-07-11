import Link from "next/link"
import { Lock } from "lucide-react"

import { Button } from "@/components/ui/button"

export function AccessDenied() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-bg-base px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-subtle text-text-muted">
        <Lock className="h-8 w-8" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-text-primary">Access Denied</h1>
        <p className="max-w-sm text-sm text-text-secondary">
          You don&apos;t have access to this workspace, or it doesn&apos;t exist.
        </p>
      </div>

      <Button render={<Link href="/editor" />} variant="default" className="mt-4">
        Return to Dashboard
      </Button>
    </div>
  )
}
