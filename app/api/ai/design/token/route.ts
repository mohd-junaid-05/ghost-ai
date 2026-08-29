import { auth } from "@clerk/nextjs/server";
import { auth as triggerSdkAuth } from "@trigger.dev/sdk";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // 1. Require Clerk authentication
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }

    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).runId !== "string"
    ) {
      return new Response("Missing required field: runId", { status: 400 });
    }

    const { runId } = body as { runId: string };

    // 3. Verify ownership — the run must belong to this user
    const taskRun = await prisma.taskRun.findUnique({
      where: { runId },
    });

    if (!taskRun) {
      return new Response("Run not found", { status: 404 });
    }

    if (taskRun.userId !== userId) {
      return new Response("Forbidden", { status: 403 });
    }

    // 4. Issue a Trigger.dev public token scoped to this run
    const publicToken = await triggerSdkAuth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
        },
      },
    });

    return Response.json({ token: publicToken }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/ai/design/token] error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
