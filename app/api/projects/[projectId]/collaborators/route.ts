import { auth, createClerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  // 1. Fetch the project and its collaborators
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { collaborators: true },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // 2. Fetch the owner's Clerk account details to get their email and verify access
  let ownerUser: any = null;
  try {
    ownerUser = await clerkClient.users.getUser(project.ownerId);
  } catch (error) {
    console.error("Failed to fetch project owner from Clerk:", error);
  }

  const ownerEmail = ownerUser?.emailAddresses?.[0]?.emailAddress || "";

  // 3. Verify that the current user has access to the project
  // Access is granted if they are the owner, or if their email is in the collaborator list.
  const isOwner = project.ownerId === userId;
  
  // To verify if they are a collaborator, we fetch the current user's email from Clerk
  let currentUserEmail = "";
  try {
    const currUser = await clerkClient.users.getUser(userId);
    currentUserEmail = currUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
  } catch (error) {
    console.error("Failed to fetch current user from Clerk:", error);
  }

  const isCollaborator = currentUserEmail && project.collaborators.some(
    (c) => c.email.toLowerCase() === currentUserEmail
  );

  if (!isOwner && !isCollaborator) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // 4. Enrich collaborator list with Clerk names and avatars
  const emailsToEnrich = project.collaborators.map((c) => c.email);
  let enrichmentMap: Record<string, { name: string; imageUrl: string }> = {};

  if (emailsToEnrich.length > 0) {
    try {
      const res = await clerkClient.users.getUserList({
        emailAddress: emailsToEnrich,
      });
      // Handle both paginated and flat array results safely
      const clerkUsers = Array.isArray(res) ? res : (res?.data || []);

      clerkUsers.forEach((user: any) => {
        const primaryEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase();
        if (primaryEmail) {
          const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.username || "";
          enrichmentMap[primaryEmail] = {
            name,
            imageUrl: user.imageUrl || "",
          };
        }
      });
    } catch (error) {
      console.error("Failed to enrich emails with Clerk profiles:", error);
    }
  }

  const enrichedCollaborators = project.collaborators.map((c) => {
    const emailLower = c.email.toLowerCase();
    const clerkInfo = enrichmentMap[emailLower];
    return {
      id: c.id,
      email: c.email,
      name: clerkInfo?.name || "",
      imageUrl: clerkInfo?.imageUrl || "",
      createdAt: c.createdAt,
    };
  });

  const enrichedOwner = {
    email: ownerEmail,
    name: ownerUser
      ? [ownerUser.firstName, ownerUser.lastName].filter(Boolean).join(" ").trim() || ownerUser.username || ""
      : "",
    imageUrl: ownerUser?.imageUrl || "",
  };

  return Response.json({
    owner: enrichedOwner,
    collaborators: enrichedCollaborators,
  });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  // 1. Fetch project and verify ownership
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Parse and validate invite email
  let body: { email?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !EMAIL_REGEX.test(email)) {
    return Response.json({ error: "A valid email address is required" }, { status: 400 });
  }

  const targetEmailLower = email.toLowerCase();

  // 3. Ensure they aren't inviting themselves (the owner)
  let ownerUser: any = null;
  try {
    ownerUser = await clerkClient.users.getUser(project.ownerId);
  } catch (error) {
    console.error("Failed to fetch project owner to validate invite:", error);
  }
  const ownerEmail = ownerUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";

  if (targetEmailLower === ownerEmail) {
    return Response.json({ error: "You cannot invite yourself" }, { status: 400 });
  }
  // 4. Create collaborator, relying on the unique constraint to guard against races
  try {
    const collaborator = await prisma.projectCollaborator.create({
      data: { projectId, email: targetEmailLower },
    });
    return Response.json({ collaborator }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return Response.json({ error: "Collaborator is already invited" }, { status: 400 });
    }
    throw error;
  }
}


export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  // 1. Fetch project and verify ownership
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Parse collaborator email from query params
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim();

  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  // 3. Remove collaborator from project
  try {
    await prisma.projectCollaborator.delete({
      where: {
        projectId_email: {
          projectId,
          email: email.toLowerCase(),
        },
      },
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete collaborator:", error);
    return Response.json({ error: "Collaborator not found" }, { status: 404 });
  }
}