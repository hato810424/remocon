import { Hono } from "hono";
import { Variables } from "./index";

const app = new Hono<{ Variables: Variables }>().basePath("/api");

const handler = app
  .get(
    "/",
    async (c) => c.text("Hello World")
  )
  .get(
    "/health",
    async(c) => {
      const obsController = c.get("obsController");
      if (!obsController.getConnectionStatus()) {
        return c.json({ error: "OBSController is not connected" }, 500);
      }
      return c.json({ status: "ok" });
    }
  )
  .get(
    "/obs/scenes",
    async (c) => {
      const obsController = c.get("obsController");
      const scenes = await obsController.getScenes();
      return c.json(
        scenes.reverse()
          // シーン名が【素材】で始まる場合は除外
          .filter(scene => !(scene.sceneName?.toString().startsWith("【素材】")))
        );
    }
  )

export type AppType = typeof handler;
export default handler;
