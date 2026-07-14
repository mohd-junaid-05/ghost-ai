import { auth, currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

// Infer the Project shape from the Prisma client return type
type Project = Awaited<ReturnType<typeof prisma.project.findFirst>>
// findFirst can return null; we filter those out so the exported shape is non-null
export type ProjectRecord = NonNullable<Project>

export interface ProjectsData {
  owned: ProjectRecord[]
  shared: ProjectRecord[]
}

/**
 * Fetch the authenticated user's owned and shared projects.
 * Must be called from a Server Component or Route Handler — never from a
 * Client Component.
 */
export async function getUserProjects(): Promise<ProjectsData> {
  const { userId } = await auth()

  if (!userId) {
    return { owned: [], shared: [] }
  }

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null

  const [owned, sharedCollaborators] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
    }),
    email
      ? prisma.projectCollaborator.findMany({
          where: { email },
          include: { project: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ])

  const shared = sharedCollaborators.map((c) => c.project)

  return { owned, shared }
}
