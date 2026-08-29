import { auth } from "@clerk/nextjs/server";
import { tasks, auth as triggerSdkAuth } from "@trigger.dev/sdk";
import type { designAgent } from "@/trigger/design-agent";
import prisma from "@/lib/prisma";

interface DesignTriggerBody {
  prompt: string;
  roomId: string;
  projectId?: string;
}

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
      typeof (body as Record<string, unknown>).prompt !== "string" ||
      typeof (body as Record<string, unknown>).roomId !== "string"
    ) {
      return new Response(
        "Missing required fields: prompt, roomId",
        { status: 400 }
      );
    }

    const { prompt, roomId, projectId } = body as DesignTriggerBody;
    const resolvedProjectId = projectId || roomId;

    if (!prompt.trim()) {
      return new Response("prompt must not be empty", { status: 400 });
    }

    // 3. Trigger the background design task (type-only import — no task instance in backend bundles)
    const handle = await tasks.trigger<typeof designAgent>("design-agent", {
      prompt,
      roomId,
    });

    // 4. Persist the task run record for ownership verification
    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: resolvedProjectId,
        userId,
      },
    });

    // 5. Issue a Trigger.dev public token scoped to this run
    const publicToken = await triggerSdkAuth.createPublicToken({
      scopes: {
        read: {
          runs: [handle.id],
        },
      },
    });

    return Response.json({ runId: handle.id, publicToken }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/ai/design] error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
