import { Hono } from "hono";
import { compress } from "hono/compress";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import dotenv from "dotenv";
import ngrok from "@ngrok/ngrok";
import qrcode from "qrcode-terminal";
import { relative, resolve } from "path";
import { createApp, obsController, voicemeeterController } from "../index";
import socket from "../socket";
import { root } from "../../root";
import { readFileSync } from "fs";

dotenv.config({ path: resolve(import.meta.dirname, "../../../../.env") });

const app = new Hono();

app.use("*", compress());
app.use("*", serveStatic({ root: relative(root, resolve(import.meta.dirname, "../../../frontend/dist/client")) }));
app.route("/", createApp());

app.notFound(async (c) => {
  const html = readFileSync(resolve(import.meta.dirname, "../../../frontend/dist/client/404.html"), { encoding: "utf-8" });
  return c.html(html);
});

const server = serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PROD_PORT) || 3000,
  },
  (info) => {
    console.log(`Server is running: http://${info.address}:${info.port}`);
  }
);

socket({ server, obsController, voicemeeterController });

if (process.env.NGROK) {
  ngrok.connect({
    addr: Number(process.env.PROD_PORT) || 3000,
    domain: process.env.NGROK_DOMAIN,
    authtoken_from_env: true
  }).then(listener => {
    console.log(`Ingress established at: ${listener.url()}`)
    qrcode.generate(listener.url() ?? "", {small: true});
  });
}
