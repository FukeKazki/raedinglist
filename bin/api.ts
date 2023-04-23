#!/usr/bin/env -S deno run -A

import { Application, Router, RouterContext } from "oak";
import { oakCors } from "cors";
import { create, getFiles } from "./read.ts";

const app = new Application();
const router = new Router();
const PORT = 80 as const;

app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.log(
    `Listening on: ${secure ? "https://" : "http://"}${
      hostname ??
        "localhost"
    }:${port}`,
  );
});

app.addEventListener("error", (evt) => {
  console.log(evt.error);
});

router.get("/list", async (ctx: RouterContext) => {
  const files = await getFiles("desc");

  const response = [];
  for (const file of files) {
    const res = await Deno.readTextFile(file);
    const json = JSON.parse(res) as JSON;
    response.push(json);
  }

  ctx.response.body = {
    list: response.flat(),
  };
});

router.post("/add", async (ctx) => {
  const { title, url } = await ctx.request.body().value;
  await create(title, url);
  ctx.response.body = "";
});

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: PORT });
