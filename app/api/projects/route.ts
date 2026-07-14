import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ projects });
}


export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: unknown; roomId?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // no body or invalid JSON — fall through with empty body
  }

  const name =
    typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim()
      : "Untitled Project";

  const data: any = {
    ownerId: userId,
    name,
  };

  if (typeof body.roomId === "string" && body.roomId.trim().length > 0) {
    data.id = body.roomId.trim();
  }

  const project = await prisma.project.create({
    data,
  });

  return Response.json({ project }, { status: 201 });
}
