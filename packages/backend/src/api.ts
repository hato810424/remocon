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

export type AppType = typeof handler;
export default handler;
