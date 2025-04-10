import { Hono } from "hono";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";
import { OBSController } from "./utils/obs-controller";
import apiRouter from "./api";

export type Variables = {
  obsController: OBSController;
}

const app = new Hono<{ Variables: Variables }>();

app.use("*", logger());
app.use("*", poweredBy());

// OBSControllerを初期化
const obsController = new OBSController({ url: "ws://192.168.10.110:4455" });
obsController.connect();
app.use("*", async (c, next) => {
  c.set("obsController", obsController);
  await next();
});

// ルーティング
app.route("/", apiRouter);

export default app;
