import { Application, Router, RouterContext } from "oak";
import { oakCors } from "cors";
import { getFiles } from "./read.ts";

const app = new Application();
const router = new Router();
const PORT = 10020 as const;

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

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: PORT });
