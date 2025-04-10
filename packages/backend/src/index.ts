import { Hono } from "hono";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";
import { OBSController } from "./utils/obs-controller";
import apiRouter from "./api";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(import.meta.dirname, "../../../.env") });

export type Variables = {
  obsController: OBSController;
}

const app = new Hono<{ Variables: Variables }>();

app.use("*", logger());
app.use("*", poweredBy());

// OBSControllerを初期化
const obsController = new OBSController({ url: process.env.OBS_URL || "ws://localhost:4455" });
obsController.connect();
app.use("*", async (c, next) => {
  c.set("obsController", obsController);
  await next();
});

// ルーティング
app.route("/", apiRouter);

export default app;
