import { auth, currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import type { ProjectRecord } from "@/lib/data/projects"

export async function getClerkIdentity() {
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? null

  return { userId, email }
}

export async function checkProjectAccess(projectId: string): Promise<{ hasAccess: boolean; project?: ProjectRecord }> {
  const identity = await getClerkIdentity()
  if (!identity) return { hasAccess: false }

  const { userId, email } = identity

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { collaborators: true },
  })

  if (!project) return { hasAccess: false }

  const isOwner = project.ownerId === userId
  const isCollaborator = email && project.collaborators.some((c) => c.email.toLowerCase() === email.toLowerCase())

  if (isOwner || isCollaborator) {
    const { collaborators, ...projectData } = project
    return { hasAccess: true, project: projectData }
  }

  return { hasAccess: false }
}
