"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Sparkles, X, FileCode, Loader2, CheckCircle2, AlertCircle, Download } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEventListener, useRoom } from "@liveblocks/react/suspense";
import { useFeedMessages, useCreateFeedMessage, useSelf } from "@liveblocks/react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { AiStatusFeedPayloadSchema, AiChatMessageSchema, type AiChatMessage } from "@/types/tasks";
import { useNodes, useEdges } from "@xyflow/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Types ────────────────────────────────────────────────────────────────────

type AiStatus = "idle" | "start" | "processing" | "complete" | "error";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: AiStatus;
  steps?: { message: string; status: AiStatus }[];
}

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** The project ID — used to scope the trigger API call */
  projectId: string;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, message }: { status: AiStatus; message: string }) {
  if (status === "idle") return null;

  const config: Record<
    Exclude<AiStatus, "idle">,
    { icon: React.ReactNode; color: string }
  > = {
    start: {
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      color: "text-accent-ai",
    },
    processing: {
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      color: "text-accent-primary",
    },
    complete: {
      icon: <CheckCircle2 className="h-3 w-3" />,
      color: "text-state-success",
    },
    error: {
      icon: <AlertCircle className="h-3 w-3" />,
      color: "text-state-error",
    },
  };

  const { icon, color } = config[status as Exclude<AiStatus, "idle">] ?? config.processing;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full bg-bg-subtle border border-border-subtle select-none shadow-sm",
        color
      )}
    >
      {icon}
      <span className="truncate max-w-[180px]">{message}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AiSidebar({ isOpen, onClose, projectId }: AiSidebarProps) {
  const room = useRoom();
  const roomId = room.id;
  const self = useSelf();

  const [input, setInput] = useState("");
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [aiStatusMessage, setAiStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scoped Trigger.dev run states
  const [runId, setRunId] = useState<string | undefined>(undefined);
  const [publicToken, setPublicToken] = useState<string | undefined>(undefined);

  const { run } = useRealtimeRun(runId, {
    accessToken: publicToken,
    enabled: !!runId && !!publicToken,
  });

  const isRunActive = !!runId && run && !["COMPLETED", "FAILED", "CRASHED", "CANCELLED"].includes(run.status);

  // React Flow hooks to fetch active canvas nodes/edges
  const nodes = useNodes();
  const edges = useEdges();

  // Specs states
  const [specs, setSpecs] = useState<any[]>([]);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<{ id: string; createdAt: string; filePath: string } | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Scoped Trigger.dev spec generation states
  const [specRunId, setSpecRunId] = useState<string | undefined>(undefined);
  const [specPublicToken, setSpecPublicToken] = useState<string | undefined>(undefined);

  const { run: specRun } = useRealtimeRun(specRunId, {
    accessToken: specPublicToken,
    enabled: !!specRunId && !!specPublicToken,
  });

  const isSpecGenerating = !!specRunId && specRun && !["COMPLETED", "FAILED", "CRASHED", "CANCELLED"].includes(specRun.status);

  // Helper to parse dynamic filename from path URL
  const getFilename = (filePath: string) => {
    try {
      const parts = filePath.split("/");
      return parts[parts.length - 1];
    } catch {
      return "specification.md";
    }
  };

  // Callback to fetch spec list
  const fetchSpecs = useCallback(async () => {
    setLoadingSpecs(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/specs`);
      if (res.ok) {
        const data = await res.json();
        setSpecs(data.specs || []);
      }
    } catch (err) {
      console.error("Failed to fetch specs", err);
    } finally {
      setLoadingSpecs(false);
    }
  }, [projectId]);

  // Load specs when specs tab is activated or on initial mount
  const [activeTab, setActiveTab] = useState("architect");

  useEffect(() => {
    if (activeTab === "specs") {
      fetchSpecs();
    }
  }, [activeTab, fetchSpecs]);

  // Reset spec trigger states when run completes, and refresh list
  useEffect(() => {
    if (specRun && ["COMPLETED", "FAILED", "CRASHED", "CANCELLED"].includes(specRun.status)) {
      setSpecRunId(undefined);
      setSpecPublicToken(undefined);
      fetchSpecs();
    }
  }, [specRun, fetchSpecs]);



  // General room chat state
  const [chatInput, setChatInput] = useState("");
  const roomChatEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to the shared AI status feed
  const { messages: feedMessages } = useFeedMessages("ai-status-feed");
  const latestFeedMessage = feedMessages && feedMessages.length > 0
    ? feedMessages[feedMessages.length - 1]
    : null;

  // Validate the latest status feed message payload
  let sharedAiStatus: AiStatus = "idle";
  let sharedAiStatusMessage = "";

  if (latestFeedMessage?.data) {
    const result = AiStatusFeedPayloadSchema.safeParse(latestFeedMessage.data);
    if (result.success) {
      sharedAiStatus = result.data.status;
      sharedAiStatusMessage = result.data.text || result.data.message;
    }
  }

  // Active generation state is true if either local isSubmitting is true
  // OR the shared status is active (start or processing)
  // OR there is an active Trigger.dev run
  const isGenerating = isSubmitting || sharedAiStatus === "start" || sharedAiStatus === "processing" || !!isRunActive;

  // Subscribe to the shared AI chat feed
  const { messages: chatFeedMessages } = useFeedMessages("ai-chat");
  const createFeedMessage = useCreateFeedMessage();

  // Validate and parse feed chat messages
  const chatMessages: AiChatMessage[] = [];
  if (chatFeedMessages) {
    for (const msg of chatFeedMessages) {
      if (msg.data) {
        const result = AiChatMessageSchema.safeParse(msg.data);
        if (result.success) {
          chatMessages.push(result.data);
        }
      }
    }
  }

  // Subscribe to the shared room-chat feed
  const { messages: roomChatFeedMessages } = useFeedMessages("room-chat");

  // Validate and parse room chat messages
  const roomChatMessages: AiChatMessage[] = [];
  if (roomChatFeedMessages) {
    for (const msg of roomChatFeedMessages) {
      if (msg.data) {
        const result = AiChatMessageSchema.safeParse(msg.data);
        if (result.success) {
          roomChatMessages.push(result.data);
        }
      }
    }
  }

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isGenerating]);

  useEffect(() => {
    if (roomChatEndRef.current) {
      roomChatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [roomChatMessages]);

  // Listen for AI status broadcasts from the background task
  useEventListener(({ event }) => {
    if (event.type !== "ai-status") return;
    const { status, message } = event;
    setAiStatus(status);
    setAiStatusMessage(message);

    if (status === "complete" || status === "error") {
      // Reset submission locks after a delay
      setTimeout(() => {
        setAiStatus("idle");
        setAiStatusMessage("");
        setIsSubmitting(false);
      }, 3000);
    }
  });

  // Reset local Trigger.dev run reference states when task run exits
  useEffect(() => {
    if (run && ["COMPLETED", "FAILED", "CRASHED", "CANCELLED"].includes(run.status)) {
      setRunId(undefined);
      setPublicToken(undefined);
    }
  }, [run]);

  const handleGenerateSpec = useCallback(async () => {
    if (isSpecGenerating || isGenerating) return;

    try {
      const chatHistory = chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Single POST returns both runId and publicToken — same pattern as /api/ai/design
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, chatHistory, nodes, edges }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        throw new Error(`Spec request failed (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const { runId: newSpecRunId, publicToken: newSpecToken } = data;

      if (!newSpecRunId || !newSpecToken) {
        throw new Error("Invalid response from spec API: missing runId or publicToken");
      }

      setSpecRunId(newSpecRunId);
      setSpecPublicToken(newSpecToken);
    } catch (err) {
      console.error("Failed to trigger spec generation", err);
    }
  }, [isSpecGenerating, isGenerating, chatMessages, roomId, nodes, edges]);

  const handleOpenPreview = useCallback(async (spec: { id: string; createdAt: string; filePath: string }) => {
    setSelectedSpec(spec);
    setLoadingPreview(true);
    setPreviewContent("");
    try {
      const res = await fetch(`/api/projects/${projectId}/specs/${spec.id}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewContent(data.content || "");
      } else {
        setPreviewContent("Failed to load specification content.");
      }
    } catch (err) {
      console.error(err);
      setPreviewContent("An error occurred while loading content.");
    } finally {
      setLoadingPreview(false);
    }
  }, [projectId]);

  const handleDownloadSpec = useCallback((specId: string) => {
    window.open(`/api/projects/${projectId}/specs/${specId}/download`, "_blank");
  }, [projectId]);

  // Lightweight custom markdown parser
  const renderMarkdown = (content: string) => {
    const lines = content.split("\n");
    let inCodeBlock = false;
    let codeLines: string[] = [];
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("```")) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${i}`} className="p-3 bg-bg-subtle border border-border-subtle rounded-lg font-mono text-xs overflow-x-auto text-text-secondary my-3 whitespace-pre-wrap select-text">
              <code>{codeLines.join("\n")}</code>
            </pre>
          );
          codeLines = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      if (line.startsWith("# ")) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-base font-bold text-text-primary mt-5 mb-2.5 border-b border-border-subtle pb-1.5 select-text">
            {line.substring(2)}
          </h1>
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-sm font-bold text-text-primary mt-4 mb-2 select-text">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-xs font-bold text-text-primary mt-3 mb-1.5 select-text">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <li key={`li-${i}`} className="text-xs text-text-secondary ml-4 list-disc mb-1 select-text">
            {line.substring(2)}
          </li>
        );
      } else if (line.trim() === "") {
        elements.push(<div key={`empty-${i}`} className="h-2" />);
      } else {
        elements.push(
          <p key={`p-${i}`} className="text-xs text-text-secondary leading-relaxed mb-2 select-text">
            {line}
          </p>
        );
      }
    }

    return <div className="space-y-1 select-text">{elements}</div>;
  };


  const handleSubmit = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || isGenerating) return;

    // Build the chat message payload matching AiChatMessageSchema
    const messagePayload = {
      sender: {
        id: self?.id || "anonymous",
        name: self?.info?.name || "Anonymous",
        avatar: self?.info?.avatar || "",
      },
      role: "user" as const,
      content: prompt,
      timestamp: Date.now(),
    };

    try {
      setInput("");
      
      // 1. Publish user message to the room-scoped ai-chat feed
      await createFeedMessage("ai-chat", messagePayload);

      // 2. Set submitting state
      setIsSubmitting(true);
      setAiStatus("start");
      setAiStatusMessage("Analyzing your request...");

      // 3. Trigger the background design agent task
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, roomId, projectId }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data = await res.json();
      const { runId: newRunId, publicToken: newPublicToken } = data;
      setRunId(newRunId);
      setPublicToken(newPublicToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message.";
      setAiStatus("error");
      setAiStatusMessage(message);

      setTimeout(() => {
        setAiStatus("idle");
        setAiStatusMessage("");
        setIsSubmitting(false);
      }, 3000);
    }
  }, [input, isGenerating, roomId, projectId, self, createFeedMessage, setRunId, setPublicToken]);

  const handleSendRoomChat = useCallback(async () => {
    const prompt = chatInput.trim();
    if (!prompt) return;

    const messagePayload = {
      sender: {
        id: self?.id || "anonymous",
        name: self?.info?.name || "Anonymous",
        avatar: self?.info?.avatar || "",
      },
      role: "user" as const,
      content: prompt,
      timestamp: Date.now(),
    };

    try {
      setChatInput("");
      await createFeedMessage("room-chat", messagePayload);
    } catch (err) {
      console.error("Failed to send room chat message", err);
    }
  }, [chatInput, self, createFeedMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (chip: string) => {
    if (isGenerating) return;
    setInput(chip);
  };

  const hasMessages = chatMessages.length > 0;

  return (
    <div
      inert={!isOpen ? true : undefined}
      className={cn(
        "fixed right-0 top-14 z-30 flex h-[calc(100dvh-3.5rem)] w-80 flex-col border-l border-border-default bg-bg-surface/95 backdrop-blur-md shadow-2xl transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-[calc(100%+24px)]",
      )}
    >
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-default px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-subtle text-accent-ai shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-text-primary leading-tight">
              AI Workspace
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-semibold text-text-muted">
                Collaborate with Ghost AI
              </span>
              {isGenerating && (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-accent-ai/20 text-accent-ai animate-pulse">
                  <span className="h-1 w-1 rounded-full bg-accent-ai animate-ping" />
                  Working
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-bg-subtle hover:text-text-primary transition-colors"
          aria-label="Close AI Sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-1 flex-col overflow-hidden p-0"
      >
        <div className="px-4 pt-4 pb-2 border-b border-border-subtle shrink-0">
          <TabsList className="w-full grid grid-cols-3 p-1 bg-bg-subtle rounded-lg">
            <TabsTrigger
              value="architect"
              className="rounded-md data-active:bg-bg-surface data-active:text-text-primary data-active:shadow-sm text-text-muted"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="rounded-md data-active:bg-bg-surface data-active:text-text-primary data-active:shadow-sm text-text-muted"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="rounded-md data-active:bg-bg-surface data-active:text-text-primary data-active:shadow-sm text-text-muted"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="architect"
          className="flex flex-1 flex-col overflow-hidden m-0 data-[state=inactive]:hidden outline-none"
        >
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
            {!hasMessages && (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-subtle text-accent-ai mb-4 shadow-sm animate-pulse">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="text-xs text-text-secondary leading-relaxed max-w-[200px] mb-6">
                  Describe the architecture you want to build, or choose a starter
                  prompt below.
                </p>

                <div className="flex flex-col gap-2.5 w-full mt-2">
                  {[
                    "Design an e-commerce backend",
                    "Create a chat app architecture",
                    "Build a CI/CD pipeline",
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleChipClick(chip)}
                      className="group flex items-center justify-between text-xs font-semibold text-accent-primary bg-bg-subtle hover:bg-accent-primary-dim hover:text-accent-primary border border-border-subtle hover:border-accent-primary/40 rounded-xl py-2.5 px-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,200,212,0.08)]"
                    >
                      <span className="text-text-secondary group-hover:text-accent-primary transition-colors">
                        {chip}
                      </span>
                      <span className="opacity-40 group-hover:opacity-100 group-hover:text-accent-primary transition-all transform group-hover:translate-x-1 duration-300">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {chatMessages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.timestamp + "-" + msg.sender.id} className="flex flex-col gap-1 w-full items-end animate-fade-in">
                    <div className="flex items-center gap-1.5 text-[9px] text-text-muted select-none mr-1">
                      <span>{msg.sender.name}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-xs rounded-2xl px-3.5 py-2.5 max-w-[85%] leading-relaxed bg-[#62C073] border border-[#62C073]/30 text-white rounded-tr-sm shadow-sm transition-all duration-300">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              // Assistant message
              return (
                <div
                  key={msg.timestamp + "-assistant"}
                  className="flex flex-col gap-2.5 w-full items-start p-4 rounded-2xl border bg-bg-elevated border-border-default shadow-sm transition-all duration-300 animate-fade-in"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent-ai to-accent-primary text-white shadow-sm animate-fade-in">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary">
                        Ghost AI Agent
                      </span>
                    </div>
                    <span className="text-[9px] text-text-muted">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Steps Progress Timeline */}
                  {(() => {
                    const steps = msg.steps;
                    if (!steps || steps.length === 0) return null;
                    return (
                      <div className="flex flex-col gap-2 mt-1 w-full pl-1 relative border-l border-border-subtle/50 ml-3 mb-2 animate-fade-in">
                        {steps.map((step, idx) => {
                          const isLastStep = idx === steps.length - 1;
                          let stepStatus: "completed" | "active" | "error" = "completed";
                          if (isLastStep) {
                            if (msg.status === "complete") stepStatus = "completed";
                            else if (msg.status === "error") stepStatus = "error";
                            else stepStatus = "active";
                          }

                          return (
                            <div key={idx} className="flex items-start gap-2.5 relative -ml-[9px] py-0.5 animate-fade-in">
                              <div className="flex items-center justify-center bg-bg-elevated z-10 rounded-full h-4 w-4 shrink-0 mt-0.5">
                                {stepStatus === "completed" ? (
                                  <div className="h-2 w-2 rounded-full bg-state-success shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                ) : stepStatus === "error" ? (
                                  <div className="h-2 w-2 rounded-full bg-state-error shadow-[0_0_8px_rgba(255,77,79,0.5)]" />
                                ) : (
                                  <div className="h-2 w-2 rounded-full bg-accent-ai animate-ping shadow-[0_0_8px_rgba(100,87,249,0.5)]" />
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-[10px] font-medium leading-relaxed transition-colors duration-300",
                                  stepStatus === "active"
                                    ? "text-text-primary font-semibold"
                                    : stepStatus === "error"
                                    ? "text-state-error font-semibold"
                                    : "text-text-muted"
                                )}
                              >
                                {step.message}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Final Response Content or Error Box */}
                  {msg.status !== "start" && msg.status !== "processing" && (
                    <div
                      className={cn(
                        "text-xs leading-relaxed text-text-secondary w-full mt-1 p-3 rounded-xl border animate-fade-in",
                        msg.status === "complete"
                          ? "bg-bg-subtle/50 border-border-subtle"
                          : msg.status === "error"
                          ? "bg-state-error/5 border-state-error/20 text-state-error"
                          : "bg-bg-subtle/50 border-border-subtle"
                      )}
                    >
                      {msg.status === "error" && (
                        <div className="font-bold text-[10px] uppercase tracking-wider mb-1">
                          Error Details
                        </div>
                      )}
                      <div>{msg.content}</div>
                    </div>
                  )}

                  {/* Thinking Spinner for Active state if no steps or currently processing */}
                  {(msg.status === "start" || msg.status === "processing") && (
                    <div className="flex items-center gap-2 text-[10px] text-text-muted ml-3 animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin text-accent-ai" />
                      <span>AI is thinking...</span>
                    </div>
                  )}
                </div>
              );
            })}

            <div ref={chatEndRef} />
          </div>

          {/* Shared Status Strip */}
          {(sharedAiStatus === "start" || sharedAiStatus === "processing" || !!isRunActive) && (
            <div className="px-4 py-2 border-t border-border-default bg-bg-base flex items-center gap-2 text-[10px] font-mono text-text-secondary select-none animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#62C073] shrink-0" />
              <span className="truncate text-text-primary">
                {sharedAiStatusMessage || "Ghost AI is analyzing your request..."}
              </span>
            </div>
          )}

          {/* Input Area */}
          <div className="shrink-0 p-4 border-t border-border-default bg-bg-surface">
            <div className="relative">
              <Textarea
                aria-label="Describe your system"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your system..."
                disabled={isGenerating}
                className="min-h-[72px] max-h-[160px] resize-none pb-12 rounded-xl bg-bg-elevated border border-border-default text-text-primary placeholder:text-text-muted focus:border-accent-primary/40 focus:ring-1 focus:ring-accent-primary/20 text-xs disabled:opacity-60 transition-all duration-300 outline-none"
              />
              <div className="absolute bottom-2 right-2 flex items-center justify-end">
                <Button
                  size="sm"
                  className="h-8 rounded-lg bg-[#62C073] hover:bg-[#62C073]/90 text-white font-semibold px-4 text-xs disabled:opacity-40 transition-all duration-300 shadow-[0_0_10px_rgba(98,192,115,0.15)] hover:shadow-[0_0_15px_rgba(98,192,115,0.3)] disabled:shadow-none"
                  disabled={isGenerating || !input.trim()}
                  onClick={handleSubmit}
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span>Send</span>
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}
                </Button>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="text-[10px] text-text-muted">
                Shift+Enter for newline
              </span>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="chat"
          className="flex flex-1 flex-col overflow-hidden m-0 data-[state=inactive]:hidden outline-none"
        >
          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
            {roomChatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-xs text-text-secondary leading-relaxed max-w-[200px]">
                  No messages yet. Start chatting with other collaborators in this room!
                </p>
              </div>
            )}
            {roomChatMessages.map((msg) => (
              <div
                key={msg.timestamp + "-" + msg.sender.id}
                className={cn(
                  "flex flex-col gap-1 w-full animate-fade-in",
                  msg.sender.id === self?.id ? "items-end" : "items-start"
                )}
              >
                <div className="flex items-center gap-1.5 text-[9px] text-text-muted select-none px-1">
                  <span>{msg.sender.name}</span>
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div
                  className={cn(
                    "text-xs rounded-2xl px-3.5 py-2.5 max-w-[85%] leading-relaxed shadow-sm border",
                    msg.sender.id === self?.id
                      ? "bg-[#62C073] border-[#62C073]/30 text-white rounded-tr-sm"
                      : "bg-bg-elevated border-border-default text-text-primary rounded-tl-sm"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={roomChatEndRef} />
          </div>

          {/* Input Area */}
          <div className="shrink-0 p-4 border-t border-border-default bg-bg-surface">
            <div className="relative">
              <Textarea
                aria-label="Room Chat"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendRoomChat();
                  }
                }}
                placeholder="Message collaborators..."
                className="min-h-[72px] max-h-[160px] resize-none pb-12 rounded-xl bg-bg-elevated border border-border-default text-text-primary placeholder:text-text-muted focus:border-accent-primary/40 focus:ring-1 focus:ring-accent-primary/20 text-xs transition-all duration-300 outline-none"
              />
              <div className="absolute bottom-2 right-2 flex items-center justify-end">
                <Button
                  size="sm"
                  className="h-8 rounded-lg bg-[#62C073] hover:bg-[#62C073]/90 text-white font-semibold px-4 text-xs transition-all duration-300 shadow-[0_0_10px_rgba(98,192,115,0.15)] disabled:opacity-40"
                  disabled={!chatInput.trim()}
                  onClick={handleSendRoomChat}
                >
                  Send
                </Button>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="text-[10px] text-text-muted">
                Shift+Enter for newline
              </span>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="specs"
          className="flex flex-1 flex-col overflow-y-auto p-4 m-0 data-[state=inactive]:hidden outline-none"
        >
          <div className="flex flex-col gap-4">
            <Button
              onClick={handleGenerateSpec}
              disabled={isSpecGenerating || isGenerating}
              className="w-full bg-accent-primary text-white hover:bg-accent-primary/90 font-semibold shadow-sm rounded-xl h-10 text-sm flex items-center justify-center gap-2"
            >
              {isSpecGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Spec...
                </>
              ) : (
                <>
                  <FileCode className="h-4 w-4" />
                  Generate Spec
                </>
              )}
            </Button>

            {isSpecGenerating && specRun?.metadata && (
              <div className="flex justify-center mt-1">
                <StatusBadge 
                  status={(specRun.metadata.status || "processing") as any} 
                  message={(specRun.metadata.message || "Generating spec...") as string} 
                />
              </div>
            )}

            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mt-4 mb-1">
              Generated Specs
            </div>

            {loadingSpecs && specs.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : specs.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border-default rounded-xl bg-bg-elevated p-4">
                <span className="text-xs text-text-secondary">No specs generated yet.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                {specs.map((spec) => (
                  <div
                    key={spec.id}
                    className="flex flex-col p-3 rounded-xl border border-border-default bg-bg-elevated gap-2 hover:border-accent-primary/30 transition-all duration-300 relative group"
                  >
                    <div
                      className="flex items-start gap-2.5 cursor-pointer"
                      onClick={() => handleOpenPreview(spec)}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary mt-0.5">
                        <FileCode className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col overflow-hidden select-none pr-6">
                        <span className="text-xs font-semibold text-text-primary truncate hover:text-accent-primary transition-colors">
                          {getFilename(spec.filePath)}
                        </span>
                        <span className="text-[10px] text-text-muted truncate mt-0.5">
                          {new Date(spec.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadSpec(spec.id)}
                      className="absolute right-3 top-3.5 h-6 w-6 rounded-md border border-border-subtle bg-bg-surface flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-default hover:bg-bg-subtle transition-all duration-300 shadow-sm cursor-pointer"
                      title="Download spec"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Spec Preview Modal */}
      <Dialog open={!!selectedSpec} onOpenChange={(o) => !o && setSelectedSpec(null)}>
        <DialogContent className="max-w-2xl w-[90vw] bg-bg-surface border border-border-default rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          <DialogHeader className="border-b border-border-subtle pb-4 flex flex-row items-center justify-between space-y-0">
            <div className="flex flex-col gap-1 pr-6 overflow-hidden">
              <DialogTitle className="text-base font-bold text-text-primary truncate">
                {selectedSpec ? getFilename(selectedSpec.filePath) : "Specification Preview"}
              </DialogTitle>
              <DialogDescription className="text-xs text-text-muted">
                {selectedSpec && `Generated on ${new Date(selectedSpec.createdAt).toLocaleString()}`}
              </DialogDescription>
            </div>
            {selectedSpec && (
              <Button
                size="sm"
                onClick={() => handleDownloadSpec(selectedSpec.id)}
                className="h-8 rounded-lg bg-[#62C073] hover:bg-[#62C073]/90 text-white font-semibold px-3 text-xs flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            )}
          </DialogHeader>

          <ScrollArea className="h-[50vh] max-h-[500px] mt-4 pr-3 overflow-y-auto scrollbar-thin select-text">
            {loadingPreview ? (
              <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
                <span className="text-xs text-text-secondary animate-pulse">Loading specification content...</span>
              </div>
            ) : (
              <div className="prose prose-invert select-text">
                {renderMarkdown(previewContent)}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

