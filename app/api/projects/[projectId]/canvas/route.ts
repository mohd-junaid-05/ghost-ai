import { NextRequest, NextResponse } from "next/server";
import { put, get, del } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;
  
  const { hasAccess, project } = await checkProjectAccess(projectId);
  
  if (!hasAccess || !project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!project.canvasJsonPath) {
    return NextResponse.json({ nodes: [], edges: [] });
  }

  try {
    const blobResult = await get(project.canvasJsonPath, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!blobResult) {
      return NextResponse.json({ error: "Failed to retrieve canvas state" }, { status: 404 });
    }
    const data = await new Response(blobResult.stream).json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching canvas state:", error);
    return NextResponse.json({ error: "Failed to fetch canvas state" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;

  const { hasAccess, project } = await checkProjectAccess(projectId);

  if (!hasAccess || !project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Convert to JSON string
    const canvasData = JSON.stringify(body);
    
    // Upload to Vercel Blob
    const previousPath = project.canvasJsonPath;
    const blob = await put(`projects/${projectId}/canvas.json`, canvasData, {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Update Project record with new blob URL
    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
    });

    if (previousPath) {
      await del(previousPath, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch((e) =>
        console.error("Failed to delete stale canvas blob:", e),
      );
    }

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Error saving canvas state:", error);
    return NextResponse.json({ error: "Failed to save canvas state" }, { status: 500 });
  }
}
