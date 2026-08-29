import { schemaTask, logger, metadata } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import crypto from "crypto";

// Define the payload schema for validation
const SpecGenerationPayloadSchema = z.object({
  projectId: z.string(),
  roomId: z.string(),
  chatHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

/**
 * Builds a highly descriptive system prompt for generating a technical spec
 * from nodes, edges, and developer chat history.
 */
function buildSystemPrompt(
  nodes: any[],
  edges: any[],
  chatHistory: { role: string; content: string }[]
): string {
  const nodesSummary = nodes
    .map(
      (n) =>
        `- Node ID: "${n.id}", Label: "${n.data?.label || "Untitled"}", Shape: "${
          n.data?.shape || "rectangle"
        }", Color: "${n.data?.color || "Neutral"}"`
    )
    .join("\n");

  const edgesSummary = edges
    .map(
      (e) =>
        `- Edge: "${e.source}" -> "${e.target}"${
          e.data?.label ? ` Label: "${e.data.label}"` : ""
        }`
    )
    .join("\n");

  const chatSummary =
    chatHistory.length > 0
      ? chatHistory.map((m) => `[${m.role}]: ${m.content}`).join("\n")
      : "No chat history.";

  return `You are Ghost AI, an expert system architect and principal technical writer.
Your job is to generate a comprehensive, highly detailed technical specification in Markdown format based on a system design canvas (represented by its nodes and edges) and the conversation history of the developers who designed it.

Here is the current canvas state:
### Nodes (Components)
${nodesSummary || "No nodes on the canvas."}

### Edges (Interactions/Data Flow)
${edgesSummary || "No edges on the canvas."}

### Conversation History
${chatSummary}

## Requirements for the Technical Specification:
1. Output format MUST be valid, well-structured Markdown.
2. Provide a clear hierarchy with headings (H1, H2, H3), lists, and code blocks as appropriate.
3. Include the following sections:
   - **Title**: A professional, descriptive title for the system.
   - **Executive Summary**: A brief, high-level overview of the system architecture, goals, and business/technical value.
   - **System Components (Nodes)**: Detail each node, its responsibility, its architectural role based on its shape (e.g., databases for cylinder, external integrations for hexagon, event streams for pill/circle), and color representation.
   - **Data Flow and Integrations (Edges)**: Document each connection, explaining how components communicate, what data is transmitted, and the communication protocols (e.g., REST, gRPC, Pub/Sub, queues) implied by the architecture.
   - **Architectural Analysis & Design Decisions**: Explain why this design is structured this way based on the chat history and best practices (scalability, security, reliability, latency).
   - **Implementation Recommendations**: Suggest next steps, tech stack choices, deployment considerations, and potential bottlenecks to watch out for.
4. Professional tone: write as a principal software architect.
5. Do not include meta-commentary (like "Here is the spec you requested") in the response. Return ONLY the markdown document.`;
}

export const generateSpec = schemaTask({
  id: "generate-spec",
  schema: SpecGenerationPayloadSchema,
  retry: { maxAttempts: 2 },
  run: async (payload, { ctx }) => {
    const { projectId, roomId, chatHistory, nodes, edges } = payload;

    logger.info("[generate-spec] Starting task execution", { projectId, roomId, attempt: ctx.attempt.number });

    // Initialize task metadata
    metadata.set("status", "generating").set("message", "Analyzing canvas and starting spec generation...");

    try {
      // 1. Retrieve OpenRouter API Key
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterApiKey) {
        throw new Error(
          "OpenRouter API key is missing. Set OPENROUTER_API_KEY in your environment."
        );
      }

      // 2. Initialize OpenRouter provider
      const openrouter = createOpenRouter({ apiKey: openRouterApiKey });

      // 3. Build prompt and generate specification text
      metadata.set("status", "generating").set("message", "Drafting technical specification with AI...");
      logger.info("[generate-spec] Invoking OpenRouter model google/gemma-4-31b-it:free");

      const systemPrompt = buildSystemPrompt(nodes, edges, chatHistory);

      const { text } = await generateText({
        model: openrouter.chat("google/gemma-4-31b-it:free"),
        system: systemPrompt,
        prompt: "Generate the technical specification based on the canvas design and chat history.",
      });

      logger.info("[generate-spec] Specification text generated successfully", { textLength: text.length });

      // 4. Upload the generated Markdown to Vercel Blob
      metadata.set("status", "generating").set("message", "Uploading spec to storage...");
      logger.info("[generate-spec] Uploading specification to Vercel Blob");

      const specFileId = crypto.randomUUID();
      const blob = await put(`specs/${projectId}/${specFileId}.md`, text, {
        access: "private",
        contentType: "text/markdown",
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      logger.info("[generate-spec] Uploaded to Vercel Blob successfully", { url: blob.url });

      // 5. Link the record to the correct project in the database
      metadata.set("status", "generating").set("message", "Saving spec metadata to database...");
      logger.info("[generate-spec] Saving ProjectSpec to database");

      const projectSpec = await prisma.projectSpec.create({
        data: {
          projectId,
          filePath: blob.url,
        },
      });

      logger.info("[generate-spec] Saved ProjectSpec successfully", { id: projectSpec.id });

      // 6. Update task metadata and return the result
      metadata.set("status", "success").set("message", "Technical spec generated successfully!");

      return {
        success: true,
        specId: projectSpec.id,
        markdown: text,
      };
    } catch (error) {
      logger.error("[generate-spec] Task run encountered an error", { error });
      
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      metadata.set("status", "error").set("message", errorMessage);
      
      throw error;
    }
  },
});
