import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import { resolve } from "path";
import { createApp, obsController, voicemeeterController } from "../index";
import socket from "../socket";

dotenv.config({ path: resolve(import.meta.dirname, "../../../../.env") });

const app = new Hono();

app.use("*", cors());
app.route("/", createApp());

const server = serve({
    fetch: app.fetch,
    port: Number(process.env.BACKEND_PORT) || 3001,
}, (info) => {
    console.log(`Server is running: http://${info.address}:${info.port}`);
});

socket({ server, obsController, voicemeeterController });
