import { Hono } from "hono";

const app = new Hono();

app.get("/demo", (c) => {
  return c.html("Hello Hono!");
});

export default app;
