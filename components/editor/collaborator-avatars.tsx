"use client"

import React from "react"
import { useOthers } from "@liveblocks/react"
import { useUser } from "@clerk/nextjs"

export function CollaboratorAvatars() {
  const { user } = useUser()
  // Use the non-suspense version so it doesn't block the navbar from rendering
  const others = useOthers()

  if (!others || !user) return null

  // Filter out the current user just in case they have multiple tabs open
  const collaborators = others.filter((other) => other.id !== user.id)

  if (collaborators.length === 0) {
    return null
  }

  const MAX_AVATARS = 5
  const visibleCollaborators = collaborators.slice(0, MAX_AVATARS)
  const overflowCount = collaborators.length - MAX_AVATARS

  return (
    <>
      <div className="flex items-center -space-x-2 mr-1">
        {visibleCollaborators.map((collaborator) => {
          const info = collaborator.info
          if (!info) return null
          
          return (
            <div
              key={collaborator.connectionId}
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-bg-surface bg-bg-elevated overflow-hidden ring-1 ring-border-default/50"
              title={info.name}
              style={{ borderColor: "#18181c" }}
            >
              {info.avatar ? (
                <img
                  src={info.avatar}
                  alt={info.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-bold text-text-primary uppercase">
                  {info.name?.charAt(0) || "?"}
                </span>
              )}
            </div>
          )
        })}
        
        {overflowCount > 0 && (
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-bg-surface bg-bg-elevated text-[10px] font-bold text-text-secondary ring-1 ring-border-default/50 z-10" style={{ borderColor: "#18181c" }}>
            +{overflowCount}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-border-default" />
    </>
  )
}
