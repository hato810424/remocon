import { Hono } from "hono";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";

const app = new Hono();

app.use("*", logger());
app.use("*", poweredBy());

app.get("/api", (c) => c.text("Hello World"));

export default app;
