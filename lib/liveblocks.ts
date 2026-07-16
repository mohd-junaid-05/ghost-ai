import { Liveblocks } from "@liveblocks/node"

// Cache client on `global` in development to survive hot-module reloads.
// In production, module caching is sufficient.
const globalForLiveblocks = globalThis as unknown as {
  liveblocks?: Liveblocks
  liveblocksKey?: string
}

const currentKey = process.env.LIVEBLOCKS_SECRET_KEY

export const liveblocks =
  globalForLiveblocks.liveblocks && globalForLiveblocks.liveblocksKey === currentKey
    ? globalForLiveblocks.liveblocks
    : new Liveblocks({
        secret: currentKey!,
      })

if (process.env.NODE_ENV !== "production") {
  globalForLiveblocks.liveblocks = liveblocks
  globalForLiveblocks.liveblocksKey = currentKey
}

// 9 vivid accent colors matching the UI palette for cursor visibility on the dark canvas
export const CURSOR_COLORS = [
  "#00C8D4", // Brand Accent / Cyan
  "#6457F9", // AI Accent / Indigo-Purple
  "#52A8FF", // Blue
  "#BF7AF0", // Purple
  "#FF990A", // Orange
  "#FF6166", // Red
  "#F75F8F", // Pink
  "#62C073", // Green
  "#0AC7B4", // Teal
]

/**
 * Deterministically hashes a user ID and maps it to a consistent cursor color.
 */
export function getCursorColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length
  return CURSOR_COLORS[index]
}
