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

    // 2. Verify project access for user (owner or collaborator)
    const { hasAccess } = await checkProjectAccess(projectId);
    if (!hasAccess) {
      return new Response("Forbidden", { status: 403 });
    }

    // 3. Fetch ProjectSpec and verify relationship with project
    const spec = await prisma.projectSpec.findUnique({
      where: { id: specId },
    });

    if (!spec || spec.projectId !== projectId) {
      return new Response("Not Found", { status: 404 });
    }

    // 4. Retrieve the file stream from Vercel Blob
    const blobResult = await get(spec.filePath, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!blobResult) {
      return new Response("Failed to retrieve specification file from storage", { status: 404 });
    }

    // 5. Return the stream as a downloadable attachment response
    return new Response(blobResult.stream, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="spec-${specId}.md"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/projects/[projectId]/specs/[specId]/download] error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
