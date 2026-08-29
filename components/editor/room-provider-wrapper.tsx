"use client"

import React, { ReactNode } from "react"
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense"

interface RoomProviderWrapperProps {
  roomId: string
  children: ReactNode
}

export function RoomProviderWrapper({ roomId, children }: RoomProviderWrapperProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{
          cursor: null,
          isThinking: false,
        }}
      >
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  )
}
