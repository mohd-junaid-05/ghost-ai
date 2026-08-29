import { task, logger } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { Liveblocks } from "@liveblocks/node";
import type { JsonObject } from "@liveblocks/core";
import { MarkerType } from "@xyflow/react";

import {
  type CanvasNode,
  type CanvasEdge,
  NODE_COLORS,
  NODE_SHAPES,
} from "@/types/canvas";

// ─── Types ────────────────────────────────────────────────────────────────────

const AI_AGENT_USER_ID = "ghost-ai-agent";
const AI_AGENT_NAME = "Ghost AI";
const AI_AGENT_COLOR = "#6457F9"; // AI Accent from the palette

/** Shape of a canvas action the LLM can emit */
const CanvasActionSchema = z.object({
  actions: z.array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("add_node"),
        id: z.string(),
        label: z.string(),
        shape: z.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]),
        color: z.string().describe("Fill color hex from the allowed palette"),
        x: z.number(),
        y: z.number(),
        width: z.number().optional(),
        height: z.number().optional(),
      }),
      z.object({
        type: z.literal("move_node"),
        id: z.string(),
        x: z.number(),
        y: z.number(),
      }),
      z.object({
        type: z.literal("resize_node"),
        id: z.string(),
        width: z.number(),
        height: z.number(),
      }),
      z.object({
        type: z.literal("update_node"),
        id: z.string(),
        label: z.string().optional(),
        shape: z.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]).optional(),
        color: z.string().optional(),
      }),
      z.object({
        type: z.literal("delete_node"),
        id: z.string(),
      }),
      z.object({
        type: z.literal("add_edge"),
        id: z.string(),
        source: z.string(),
        target: z.string(),
        label: z.string().optional(),
      }),
      z.object({
        type: z.literal("delete_edge"),
        id: z.string(),
      }),
    ])
  ),
  summary: z.string().describe("Short human-readable description of what was generated"),
});

type CanvasAction = z.infer<typeof CanvasActionSchema>["actions"][number];

// ─── Liveblocks helpers ───────────────────────────────────────────────────────

function createLiveblocksClient() {
  return new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY! });
}

/**
 * Set AI presence in the room via the Liveblocks REST API.
 * Uses ephemeral presence with a TTL so it auto-expires.
 */
async function setAiPresence(roomId: string, status: string, ttl = 30) {
  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY!;
  try {
    await fetch(`https://api.liveblocks.io/v2/rooms/${encodeURIComponent(roomId)}/presence`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: AI_AGENT_USER_ID,
        data: {
          isThinking: status === "thinking",
          thinking: status === "thinking",
          cursor: null,
          status,
        },
        userInfo: {
          name: AI_AGENT_NAME,
          avatar: "",
          color: AI_AGENT_COLOR,
        },
        ttl,
      }),
    });
  } catch (err) {
    logger.warn("[design-agent] Failed to set AI presence", { err });
  }
}

/**
 * Broadcast a status event to all connected clients in the room.
 * Clients can listen with useEventListener to show progress toasts.
 */
async function broadcastStatus(
  roomId: string,
  status: "start" | "processing" | "complete" | "error",
  message: string
) {
  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY!;
  try {
    await fetch(
      `https://api.liveblocks.io/v2/rooms/${encodeURIComponent(roomId)}/broadcast`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: { type: "ai-status", status, message },
        }),
      }
    );

    // Also write to the ai-status-feed using safe helper
    try {
      const feedClient = new Liveblocks({ secret: secretKey });
      await safeFeedMessage(feedClient, roomId, "ai-status-feed", {
        status,
        message,
        text: message,
      });
    } catch (feedErr) {
      logger.warn("[design-agent] Failed to write to ai-status-feed", { feedErr });
    }
  } catch (err) {
    logger.warn("[design-agent] Failed to broadcast status", { err });
  }
}

/** Clear AI presence by setting a very short TTL. */
async function clearAiPresence(roomId: string) {
  await setAiPresence(roomId, "idle", 2);
}

/**
 * Ensure a Liveblocks feed exists before writing to it.
 * Feeds must be created explicitly; `createFeedMessage` will 500 if
 * the feed hasn't been initialized yet.
 */
async function ensureFeedExists(
  client: ReturnType<typeof createLiveblocksClient>,
  roomId: string,
  feedId: string
) {
  try {
    await client.createFeed({ roomId, feedId });
  } catch {
    // Ignore — feed likely already exists (409) or other non-fatal error
  }
}

/**
 * Safely write a message to a Liveblocks feed.
 * Creates the feed first if needed, then writes the message.
 */
async function safeFeedMessage(
  client: ReturnType<typeof createLiveblocksClient>,
  roomId: string,
  feedId: string,
  data: JsonObject
) {
  await ensureFeedExists(client, roomId, feedId);
  return await client.createFeedMessage({ roomId, feedId, data });
}

// ─── Canvas mutation helpers ──────────────────────────────────────────────────

/** Resolve a color name or hex from the LLM to the nearest allowed palette color. */
function resolveColor(color?: string): string {
  if (!color) return NODE_COLORS[0].fill;
  const match = NODE_COLORS.find(
    (c) =>
      c.fill.toLowerCase() === color.toLowerCase() ||
      c.name.toLowerCase() === color.toLowerCase()
  );
  return match ? match.fill : NODE_COLORS[0].fill;
}

/** Determine default dimensions for a shape. */
function defaultDimensions(shape: string): { width: number; height: number } {
  switch (shape) {
    case "circle":
      return { width: 90, height: 90 };
    case "diamond":
      return { width: 120, height: 120 };
    case "pill":
      return { width: 140, height: 70 };
    case "cylinder":
      return { width: 100, height: 110 };
    case "hexagon":
      return { width: 120, height: 100 };
    default:
      return { width: 150, height: 80 };
  }
}

/** Apply all canvas actions through mutateFlow. */
async function applyCanvasActions(
  client: ReturnType<typeof createLiveblocksClient>,
  roomId: string,
  actions: CanvasAction[]
) {
  await mutateFlow<CanvasNode, CanvasEdge>(
    { client, roomId },
    (flow) => {
      for (const action of actions) {
        switch (action.type) {
          case "add_node": {
            const dims = defaultDimensions(action.shape);
            const width = action.width ?? dims.width;
            const height = action.height ?? dims.height;
            const color = resolveColor(action.color);

            flow.addNode({
              id: action.id,
              type: "canvasNode",
              position: { x: action.x, y: action.y },
              width,
              height,
              style: { width, height },
              data: {
                label: action.label,
                color,
                shape: action.shape,
              },
            });
            break;
          }

          case "move_node": {
            flow.updateNode(action.id, (node) => ({
              ...node,
              position: { x: action.x, y: action.y },
            }));
            break;
          }

          case "resize_node": {
            flow.updateNode(action.id, (node) => ({
              ...node,
              width: action.width,
              height: action.height,
              style: { ...((node.style as Record<string, unknown>) ?? {}), width: action.width, height: action.height },
            }));
            break;
          }

          case "update_node": {
            const updates: Partial<CanvasNode["data"]> = {};
            if (action.label !== undefined) updates.label = action.label;
            if (action.shape !== undefined) updates.shape = action.shape;
            if (action.color !== undefined) updates.color = resolveColor(action.color);
            flow.updateNodeData(action.id, updates);
            break;
          }

          case "delete_node": {
            flow.removeNode(action.id);
            break;
          }

          case "add_edge": {
            flow.addEdge({
              id: action.id,
              source: action.source,
              target: action.target,
              type: "canvasEdge",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 15,
                height: 15,
                color: "#808090",
              },
              data: {
                label: action.label ?? "",
              },
            });
            break;
          }

          case "delete_edge": {
            flow.removeEdge(action.id);
            break;
          }
        }
      }
    }
  );
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(existingNodes: CanvasNode[], existingEdges: CanvasEdge[]): string {
  const canvasSummary =
    existingNodes.length > 0
      ? `The canvas currently has ${existingNodes.length} nodes and ${existingEdges.length} edges:\n${JSON.stringify(
          existingNodes.map((n) => ({
            id: n.id,
            label: n.data.label,
            shape: n.data.shape,
            color: n.data.color,
            position: n.position,
          })),
          null,
          2
        )}`
      : "The canvas is currently empty.";

  const allowedColors = NODE_COLORS.map((c) => `${c.fill} (${c.name})`).join(", ");
  const allowedShapes = NODE_SHAPES.join(", ");

  return `You are Ghost AI, an expert system architecture assistant that generates collaborative canvas designs.

Your task is to produce a list of canvas actions that implement the user's system design request. Actions are applied in order.

## Canvas State
${canvasSummary}

## Rules
- Use meaningful IDs (e.g., "api-gateway", "user-service", "db-main") — no random strings.
- For new designs, start positions around x:100,y:100 and space nodes ~200-300px apart.
- Arrange nodes logically: left-to-right for request flows, top-to-bottom for layers.
- Default node dimensions: rectangle 150×80, diamond 120×120, circle 90×90, pill 140×70, cylinder 100×110, hexagon 120×100.
- Use "rectangle" for services/APIs, "diamond" for decision/gateways, "cylinder" for databases/storage, "hexagon" for external systems, "circle" for users/clients, "pill" for queues/streams.

## Allowed fill colors (use the hex values exactly)
${allowedColors}

## Allowed shapes
${allowedShapes}

## Color conventions
- Blue (#10233D fill) for services and APIs
- Purple (#2E1938 fill) for AI/ML components
- Orange (#331B00 fill) for queues and message brokers
- Green (#0F2E18 fill) for databases and storage
- Teal (#062822 fill) for external integrations
- Red (#3C1618 fill) for error/alert paths
- Neutral (#1F1F1F fill) for clients and users

Return ONLY the JSON actions object. Be thorough but focused on the user's request.`;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export const designAgent = task({
  id: "design-agent",
  retry: { maxAttempts: 2 },
  run: async (payload: { prompt: string; roomId: string }) => {
    const { prompt, roomId } = payload;

    logger.info("[design-agent] starting", { prompt, roomId });

    const client = createLiveblocksClient();

    // 0. Ensure all required feeds exist before any writes
    for (const feedId of ["ai-status-feed", "ai-chat", "room-chat"]) {
      await ensureFeedExists(client, roomId, feedId);
    }

    // Create persistent assistant message in the ai-chat feed to show progress
    let assistantMessageId: string | undefined = undefined;
    const currentSteps: { message: string; status: "idle" | "start" | "processing" | "complete" | "error" }[] = [
      { message: "Ghost AI is analyzing your request…", status: "start" }
    ];

    try {
      const msg = await safeFeedMessage(client, roomId, "ai-chat", {
        sender: {
          id: "ghost-ai-agent",
          name: "Ghost AI",
          avatar: "",
        },
        role: "assistant",
        content: "Analyzing your request...",
        timestamp: Date.now(),
        status: "start",
        steps: currentSteps,
      });
      assistantMessageId = msg?.id;
    } catch (feedErr) {
      logger.warn("[design-agent] Failed to write initial assistant message", { feedErr });
    }

    const updateStep = async (
      status: "start" | "processing" | "complete" | "error",
      message: string,
      finalContent?: string
    ) => {
      await broadcastStatus(roomId, status, message);
      currentSteps.push({ message, status });

      if (assistantMessageId) {
        try {
          await client.updateFeedMessage({
            roomId,
            feedId: "ai-chat",
            messageId: assistantMessageId,
            data: {
              sender: {
                id: "ghost-ai-agent",
                name: "Ghost AI",
                avatar: "",
              },
              role: "assistant",
              content: finalContent || message,
              timestamp: Date.now(),
              status,
              steps: currentSteps,
            },
          });
        } catch (updateErr) {
          logger.warn("[design-agent] Failed to update assistant feed message", { updateErr });
        }
      }
    };

    // 1. Signal start
    await setAiPresence(roomId, "thinking", 120);
    await broadcastStatus(roomId, "start", "Ghost AI is analyzing your request…");

    try {
      // 2. Read current canvas state
      logger.info("[design-agent] reading current canvas state");
      let existingNodes: CanvasNode[] = [];
      let existingEdges: CanvasEdge[] = [];

      await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
        existingNodes = [...flow.nodes] as CanvasNode[];
        existingEdges = [...flow.edges] as CanvasEdge[];
      });

      logger.info("[design-agent] canvas state read", {
        nodeCount: existingNodes.length,
        edgeCount: existingEdges.length,
      });

      // 3. Call OpenRouter to interpret the prompt
      await updateStep("processing", "Generating architecture with Google Gemma…");
      await setAiPresence(roomId, "thinking", 120);

      const systemPrompt = buildSystemPrompt(existingNodes, existingEdges);

      logger.info("[design-agent] calling OpenRouter");

      // Trigger.dev workers don't load .env.local — read the key explicitly.
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;

      if (!openRouterApiKey) {
        throw new Error(
          "OpenRouter API key is missing. Set OPENROUTER_API_KEY in your environment."
        );
      }

      const openrouter = createOpenRouter({ apiKey: openRouterApiKey });

      const { object } = await generateObject({
        model: openrouter.chat("google/gemma-4-26b-a4b-it:free"),
        schema: CanvasActionSchema,
        system: systemPrompt,
        prompt,
      });

      logger.info("[design-agent] OpenRouter returned actions", {
        actionCount: object.actions.length,
        summary: object.summary,
      });

      // 4. Apply actions to the canvas
      await updateStep("processing", `Applying ${object.actions.length} changes to the canvas…`);
      await setAiPresence(roomId, "thinking", 60);

      await applyCanvasActions(client, roomId, object.actions);

      logger.info("[design-agent] canvas updated successfully");

      // 5. Signal completion
      await clearAiPresence(roomId);
      await updateStep("complete", "Canvas updated successfully!", object.summary);

      return {
        success: true,
        actionCount: object.actions.length,
        summary: object.summary,
      };
    } catch (error) {
      logger.error("[design-agent] failed", { error });

      // Clear presence and broadcast error so collaborators know
      await clearAiPresence(roomId);
      const errMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      await updateStep("error", errMessage, `Error: ${errMessage}`);

      throw error;
    }
  },
});
