import { z } from "zod";

export const AiStatusFeedPayloadSchema = z.object({
  status: z.enum(["idle", "start", "processing", "complete", "error"]),
  message: z.string(),
  text: z.string().optional(),
});

export type AiStatusFeedPayload = z.infer<typeof AiStatusFeedPayloadSchema>;

export const AiChatMessageSchema = z.object({
  sender: z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().optional(),
  }),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number(),
  status: z.enum(["idle", "start", "processing", "complete", "error"]).optional(),
  steps: z.array(
    z.object({
      message: z.string(),
      status: z.enum(["idle", "start", "processing", "complete", "error"]),
    })
  ).optional(),
});

export type AiChatMessage = z.infer<typeof AiChatMessageSchema>;

