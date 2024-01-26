import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";

const app = new Hono();

// Serve static files from the public directory.
app.use("/*", serveStatic({ root: "./" }));

app.get("/demo", (c) => {
  // TODO: Try using JSX and c.html.
  return c.text("htmx works!");
});

export default app;
