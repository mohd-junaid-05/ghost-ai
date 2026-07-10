import { SignIn } from "@clerk/nextjs"

export const metadata = {
  title: "Sign In — Ghost AI",
  description: "Sign in to your Ghost AI account to access your system design workspace.",
}

export default function SignInPage() {
  return (
    <main className="min-h-screen flex" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Left panel — branding (large screens only) */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24"
        style={{ borderRight: "1px solid var(--border-default)" }}
      >
        {/* Logo */}
        <div className="mb-10">
          <span
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Ghost{" "}
            <span style={{ color: "var(--accent-primary)" }}>AI</span>
          </span>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Collaborative System Design Workspace
          </p>
        </div>

        {/* Feature list */}
        <ul className="space-y-4">
          {[
            "Design system architectures with AI assistance",
            "Collaborate in real-time on a shared canvas",
            "Generate technical specs from your diagrams",
            "Import prebuilt starter system templates",
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <span
                className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: "var(--accent-primary)" }}
                aria-hidden="true"
              />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right panel — Clerk form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <SignIn />
      </div>
    </main>
  )
}
