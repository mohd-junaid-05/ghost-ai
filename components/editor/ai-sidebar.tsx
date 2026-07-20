"use client"

import React, { useState } from "react"
import { Bot, Sparkles, X, FileCode } from "lucide-react"

import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [input, setInput] = useState("")

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      // Submit logic would go here
      if (input.trim()) {
        setInput("")
      }
    }
  }

  return (
    <div
      className={cn(
        "fixed right-0 top-14 z-30 flex h-[calc(100dvh-3.5rem)] w-80 flex-col border-l border-border-default bg-bg-surface/95 backdrop-blur-md shadow-2xl transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-[calc(100%+24px)]"
      )}
    >
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-default px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-subtle text-accent-ai">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-text-primary leading-tight">AI Workspace</span>
            <span className="text-[10px] font-semibold text-text-muted">Collaborate with Ghost AI</span>
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

      <Tabs defaultValue="architect" className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="px-4 pt-4 pb-2 border-b border-border-subtle shrink-0">
          <TabsList className="w-full grid grid-cols-2 p-1 bg-bg-subtle rounded-lg">
            <TabsTrigger 
              value="architect" 
              className="rounded-md data-active:bg-bg-surface data-active:text-text-primary data-active:shadow-sm text-text-muted"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger 
              value="specs" 
              className="rounded-md data-active:bg-bg-surface data-active:text-text-primary data-active:shadow-sm text-text-muted"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="architect" className="flex flex-1 flex-col overflow-hidden m-0 data-[state=inactive]:hidden outline-none">
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
            
            {/* Empty State */}
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-subtle text-accent-ai mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="text-xs text-text-secondary leading-relaxed max-w-[200px] mb-6">
                Describe the architecture you want to build, or choose a starter prompt below.
              </p>
              
              <div className="flex flex-col gap-2 w-full">
                <button className="text-xs font-semibold text-accent-primary bg-bg-subtle hover:bg-bg-elevated border border-border-subtle rounded-xl py-2 px-3 text-left transition-colors">
                  Design an e-commerce backend
                </button>
                <button className="text-xs font-semibold text-accent-primary bg-bg-subtle hover:bg-bg-elevated border border-border-subtle rounded-xl py-2 px-3 text-left transition-colors">
                  Create a chat app architecture
                </button>
                <button className="text-xs font-semibold text-accent-primary bg-bg-subtle hover:bg-bg-elevated border border-border-subtle rounded-xl py-2 px-3 text-left transition-colors">
                  Build a CI/CD pipeline
                </button>
              </div>
            </div>

            {/* Example Messages (Mock) */}
            <div className="flex flex-col gap-1 items-end w-full">
              <div className="bg-accent-primary-dim border-2 border-accent-primary/50 text-text-primary text-xs rounded-2xl rounded-tr-sm px-3 py-2 max-w-[90%]">
                Can you help me design a scalable microservices architecture?
              </div>
            </div>

            <div className="flex flex-col gap-1 items-start w-full">
              <div className="bg-bg-elevated border border-border-default text-text-primary text-xs rounded-2xl rounded-tl-sm px-3 py-2.5 max-w-[95%] leading-relaxed">
                <span className="text-accent-primary font-semibold mb-1 block">Ghost AI</span>
                Absolutely! A scalable microservices architecture typically starts with an API Gateway...
              </div>
            </div>
            
          </div>

          {/* Input Area */}
          <div className="shrink-0 p-4 border-t border-border-default bg-bg-surface">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Ghost AI..."
                className="min-h-[72px] max-h-[160px] resize-none pb-12 rounded-xl bg-bg-elevated border-border-default text-text-primary placeholder:text-text-muted focus-visible:ring-accent-primary text-xs"
              />
              <div className="absolute bottom-2 right-2 flex items-center justify-end">
                <Button 
                  size="sm" 
                  className="h-8 rounded-lg bg-accent-primary text-white hover:bg-accent-primary-hover font-semibold px-4 text-xs"
                  onClick={() => {
                    if (input.trim()) setInput("")
                  }}
                >
                  Send
                </Button>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="text-[10px] text-text-muted">Return to send, Shift+Return for newline</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="specs" className="flex flex-1 flex-col overflow-y-auto p-4 m-0 data-[state=inactive]:hidden outline-none">
          <div className="flex flex-col gap-4">
            <Button className="w-full bg-accent-primary text-white hover:bg-accent-primary-hover font-semibold shadow-sm rounded-xl h-10 text-sm">
              <FileCode className="mr-2 h-4 w-4" />
              Generate Spec
            </Button>
            
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mt-4 mb-1">
              Generated Specs
            </div>
            
            {/* Demo Spec Card */}
            <div className="flex flex-col p-4 rounded-xl border border-border-default bg-bg-elevated gap-3 group relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
                  <FileCode className="h-5 w-5" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold text-text-primary truncate">
                    E-Commerce Architecture
                  </span>
                  <span className="text-[10px] text-text-secondary truncate mt-0.5">
                    Generated just now
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-text-secondary leading-relaxed bg-bg-subtle p-2.5 rounded-lg border border-border-subtle font-mono line-clamp-3">
                # Specification
                This document details the high-level design...
              </div>
              <Button disabled variant="outline" size="sm" className="w-full mt-1 text-xs h-8 rounded-lg opacity-50 cursor-not-allowed border-border-subtle">
                Download PDF
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
