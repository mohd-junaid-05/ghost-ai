import { Liveblocks } from "@liveblocks/node";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;
  console.log("Secret Key:", secretKey);
  const liveblocksClient = new Liveblocks({ secret: secretKey! });
  const roomId = "testing-ai-designs-h8dl1";
  try {
    console.log("Getting or creating room...");
    await liveblocksClient.getOrCreateRoom(roomId, {
      defaultAccesses: ["room:write"],
    });
    console.log("Room ensured.");

    console.log("Creating feed...");
    try {
      await liveblocksClient.createFeed({
        roomId,
        feedId: "ai-status-feed",
      });
      console.log("Feed created.");
    } catch (feedErr: any) {
      console.log("Feed already exists or error:", feedErr.message);
    }

    const res = await liveblocksClient.createFeedMessage({
      roomId,
      feedId: "ai-status-feed",
      data: {
        status: "start",
        message: "Test message",
        text: "Test message",
      },
    });
    console.log("Success:", res);
  } catch (error: any) {
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("Error Status:", error.status);
    console.error("Error Raw:", JSON.stringify(error, null, 2));
  }
}

run();
