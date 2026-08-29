import { task } from "@trigger.dev/sdk";

/**
 * Example task — feel free to delete or rename this.
 * Trigger it from your backend with:
 *   import { tasks } from "@trigger.dev/sdk";
 *   import type { helloWorld } from "@/trigger/example";
 *   await tasks.trigger<typeof helloWorld>("hello-world", { name: "Ghost AI" });
 */
export const helloWorld = task({
  id: "hello-world",
  run: async (payload: { name: string }) => {
    console.log(`Hello, ${payload.name}!`);
    return { message: `Hello ${payload.name}!` };
  },
});
