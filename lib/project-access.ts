import { auth, currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { ProjectRecord } from "@/lib/data/projects"

export interface Identity {
  userId: string
  email: string | null
}

export async function getIdentity(): Promise<Identity | null> {
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? null

  return { userId, email }
}

export type ProjectAccessResult =
  | { hasAccess: false; project: null }
  | { hasAccess: true; project: ProjectRecord }

/**
 * Checks if the current user has access to the given project either as the
 * owner or as an invited collaborator (by email).
 */
export async function checkProjectAccess(
  projectId: string
): Promise<ProjectAccessResult> {
  const identity = await getIdentity()
  if (!identity) {
    return { hasAccess: false, project: null }
  }

  const { userId, email } = identity

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      collaborators: true,
    },
  })

  if (!project) {
    return { hasAccess: false, project: null }
  }

  const isOwner = project.ownerId === userId
  const isCollaborator =
    email && project.collaborators.some((c) => c.email.toLowerCase() === email.toLowerCase())

  if (isOwner || isCollaborator) {
    // Strip collaborators before returning to match ProjectRecord shape
    const { collaborators, ...projectData } = project
    return { hasAccess: true, project: projectData }
  }

  return { hasAccess: false, project: null }
}
