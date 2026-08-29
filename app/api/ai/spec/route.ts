import { auth } from "@clerk/nextjs/server";
import { tasks, auth as triggerSdkAuth } from "@trigger.dev/sdk";
import type { generateSpec } from "@/trigger/generate-spec";
import prisma from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";
import { z } from "zod";

// Zod schema for validating the incoming request body
const SpecTriggerRequestSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  chatHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

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

    const validationResult = SpecTriggerRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: validationResult.error.format() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { roomId, chatHistory, nodes, edges } = validationResult.data;

    // 3. Resolve project access from roomId
    const { hasAccess } = await checkProjectAccess(roomId);
    if (!hasAccess) {
      return new Response("Forbidden", { status: 403 });
    }

    // 4. Trigger the background specification generation task (type-only import)
    const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
      projectId: roomId,
      roomId,
      chatHistory,
      nodes,
      edges,
    });

    // 5. Save a TaskRun record for ownership/access control
    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: roomId,
        userId,
      },
    });

    // 6. Mint a Trigger.dev public token scoped to this run — same pattern as /api/ai/design
    const publicToken = await triggerSdkAuth.createPublicToken({
      scopes: {
        read: {
          runs: [handle.id],
        },
      },
      expirationTime: "1h",
    });

    // 7. Return both runId and publicToken in a single response (no separate /token call needed)
    return Response.json({ runId: handle.id, publicToken }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[POST /api/ai/spec] error:", message);
    if (stack) console.error("[POST /api/ai/spec] stack:", stack.split("\n").slice(0, 8).join("\n"));
    return new Response(`Internal Server Error: ${message}`, { status: 500 });
  }
}
