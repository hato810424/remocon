import { Hono } from "hono";
import { compress } from "hono/compress";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import dotenv from "dotenv";
import { relative, resolve } from "path";
import { createApp, obsController } from "../index";
import socket from "../socket";
import { root } from "../../root";

dotenv.config({ path: resolve(import.meta.dirname, "../../../../.env") });

const app = new Hono();

app.use("*", compress());
app.use("*", serveStatic({ root: relative(root, resolve(import.meta.dirname, "../../../frontend/dist")) }));
app.route("/", createApp());

const server = serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PROD_PORT) || 3000,
  },
  (info) => {
    console.log(`Server is running: http://${info.address}:${info.port}`);
  }
);

socket({ server, obsController });
