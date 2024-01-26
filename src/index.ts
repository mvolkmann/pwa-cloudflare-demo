import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.html("Hello Hono!");
});

export default app;
