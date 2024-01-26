import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";

const app = new Hono();

// Serve static files from the public directory.
app.use("/*", serveStatic({ root: "./" }));

app.get("/get-text", (c) => {
  return c.text("This is text.");
});

app.get("/get-html", (c) => {
  return c.html(<b>This is HTML.</b>);
});

export default app;
