import { auth } from "@clerk/nextjs/server";
import { get } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";

interface RouteContext {
  params: Promise<{ projectId: string; specId: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { projectId, specId } = await params;

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

    // 3. Fetch ProjectSpec and verify it belongs to the project
    const spec = await prisma.projectSpec.findUnique({
      where: { id: specId },
    });

    if (!spec || spec.projectId !== projectId) {
      return new Response("Not Found", { status: 404 });
    }

    // 4. Download file from Vercel Blob
    const blobResult = await get(spec.filePath, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!blobResult) {
      return new Response("Failed to fetch spec content", { status: 404 });
    }

    const content = await new Response(blobResult.stream).text();

    return Response.json({ content }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/projects/[projectId]/specs/[specId]] error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
