import { Hono } from "hono";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";
import { OBSController } from "./utils/obs-controller";
import apiRouter from "./api";
import dotenv from "dotenv";
import { resolve } from "path";
import { VoicemeeterController } from "./utils/voicemeeter-controller";

dotenv.config({ path: resolve(import.meta.dirname, "../../../.env") });

// 型定義
export type Variables = {
  obsController: OBSController;
}

// OBSControllerを初期化
export const obsController = new OBSController({ url: process.env.OBS_URL || "ws://localhost:4455" });
// VoicemeeterControllerを初期化
export const voicemeeterController = new VoicemeeterController();

export function createApp() {
  const app = new Hono<{ Variables: Variables }>();

  app.use("*", logger());
  app.use("*", poweredBy());

  // OBSControllerを接続
  obsController.connect();
  app.use("*", async (c, next) => {
    c.set("obsController", obsController);
    await next();
  });
  // VoicemeeterControllerを接続
  voicemeeterController.connect();

  // ルーティング
  app.route("/", apiRouter);

  return app;
}
