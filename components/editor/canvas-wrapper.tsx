"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense"

// ── Error Boundary ──────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught a Liveblocks error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

// ── Fallbacks ───────────────────────────────────────────────────────────────

function CanvasLoadingFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-bg-base relative overflow-hidden">
      {/* Background grid representation */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Center glowing loading spinner */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-full border border-accent-primary-dim animate-ping opacity-30" />
        <div className="absolute h-16 w-16 rounded-full border border-accent-primary/20 animate-pulse opacity-50" />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated border border-border-default shadow-lg shadow-accent-primary/5 text-accent-primary animate-spin">
          <div className="h-2 w-2 rounded-full bg-accent-primary" />
        </div>
      </div>

      <span className="mt-8 text-xs font-semibold tracking-[0.25em] text-text-muted uppercase animate-pulse">
        Syncing Room State...
      </span>
    </div>
  )
}

function CanvasErrorFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-bg-base relative overflow-hidden">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-state-error/30 bg-state-error/5 text-state-error shadow-lg shadow-state-error/5">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h3 className="mt-6 text-lg font-bold text-text-primary tracking-tight">
        Collaboration Offline
      </h3>

      <p className="mt-2 max-w-xs text-xs text-text-secondary leading-relaxed">
        Failed to authenticate or connect to the collaboration session. Please verify
        your connection or configure a valid Liveblocks Secret Key.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-4 py-2 text-xs font-semibold rounded-xl bg-bg-subtle border border-border-default text-text-primary hover:bg-bg-elevated transition-colors duration-200 cursor-pointer"
      >
        Reconnect
      </button>
    </div>
  )
}

// ── Wrapper Component ───────────────────────────────────────────────────────

interface CanvasWrapperProps {
  roomId: string
  children: ReactNode
}

export function CanvasWrapper({ roomId, children }: CanvasWrapperProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{
          cursor: null,
          isThinking: false,
        }}
      >
        <ErrorBoundary fallback={<CanvasErrorFallback />}>
          <ClientSideSuspense fallback={<CanvasLoadingFallback />}>
            {children}
          </ClientSideSuspense>
        </ErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
