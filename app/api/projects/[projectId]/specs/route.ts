import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { projectId } = await params;

    // 1. Require Clerk authentication
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Verify project access
    const { hasAccess } = await checkProjectAccess(projectId);
    if (!hasAccess) {
      return new Response("Forbidden", { status: 403 });
    }

    // 3. Retrieve all project spec records ordered by createdAt descending
    const specs = await prisma.projectSpec.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ specs }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/projects/[projectId]/specs] error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
