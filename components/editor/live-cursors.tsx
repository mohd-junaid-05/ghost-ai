"use client"

import React from "react"
import { useOthers } from "@liveblocks/react/suspense"

export function LiveCursors() {
  const others = useOthers()

  return (
    <>
      {others.map((other) => {
        const cursor = other.presence?.cursor
        if (!cursor) return null

        const color = other.info?.color || "#00c8d4"
        const name = other.info?.name || "Anonymous"

        return (
          <div
            key={other.connectionId}
            className="absolute left-0 top-0 pointer-events-none z-[100] transition-all duration-100 ease-linear"
            style={{
              transform: `translateX(${cursor.x}px) translateY(${cursor.y}px)`,
            }}
          >
            {/* Custom SVG cursor */}
            <svg
              className="drop-shadow-md"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.65376 21.2198L2.2476 2.31206C2.10099 1.49818 2.8714 0.843638 3.63346 1.13695L21.4646 8.00363C22.2539 8.30747 22.3168 9.41324 21.5779 9.79248L14.7335 13.3026L9.12354 21.4851C8.70425 22.0966 7.76569 22.0145 7.49132 21.3421L5.65376 21.2198Z"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <div
              className="absolute left-5 top-5 rounded-md px-2 py-0.5 text-[10px] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis shadow-md shadow-black/20"
              style={{ backgroundColor: color }}
            >
              {name}
            </div>
          </div>
        )
      })}
    </>
  )
}
