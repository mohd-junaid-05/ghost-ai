import { auth, currentUser } from "@clerk/nextjs/server"
import { liveblocks, getCursorColor } from "@/lib/liveblocks"
import { checkProjectAccess } from "@/lib/project-access"

export async function POST(request: Request) {
  try {
    // 1. Require Clerk authentication
    const { userId } = await auth()
    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    const user = await currentUser()
    if (!user) {
      return new Response("User details not found", { status: 401 })
    }

    // Parse the request body to retrieve the room ID
    const body = await request.json().catch(() => ({}))
    const roomId = body.room

    if (!roomId || typeof roomId !== "string") {
      return new Response("Missing or invalid room ID", { status: 400 })
    }

    // 2. Verify project access using the existing access helper
    const { hasAccess } = await checkProjectAccess(roomId)
    if (!hasAccess) {
      return new Response("Forbidden", { status: 403 })
    }

    // 3. Ensure the Liveblocks room exists (create only if needed)
    // Using defaultAccesses: ["room:write"] allows write permission to the room for users we authorize here.
    try {
      await liveblocks.getOrCreateRoom(roomId, {
        defaultAccesses: ["room:write"],
      })
    } catch (err) {
      console.error("Failed to get or create Liveblocks room:", err)
    }

    // Resolve user details
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.primaryEmailAddress?.emailAddress ||
      "Collaborator"
    const avatar = user.imageUrl || ""
    const color = getCursorColor(userId)

    // 4. Return a session token with userInfo
    const { status, body: responseBody } = await liveblocks.identifyUser(
      userId,
      {
        userInfo: {
          name,
          avatar,
          color,
        },
      }
    )

    return new Response(responseBody, { status })
  } catch (error) {
    console.error("Error in liveblocks-auth route:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
