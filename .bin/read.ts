#!/usr/bin/env -S deno run -A

import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

const displayReadingList = async () => {
  console.log("hello");
  const files = [];
  for await (const dirEntry of Deno.readDir("../")) {
    if (dirEntry.isDirectory) continue;
    if (dirEntry.name === "README.md") continue;
    files.push("../" + dirEntry.name);
  }
  for (const file of files) {
    console.log(file);
    const res = await Deno.readTextFile(file);
    console.log(res);
  }
};

await new Command()
  .name("reading")
  .version("0.1.0")
  .description("readinglistを閲覧するためのCLIです")
  .action((_options, ..._args) => displayReadingList())
  .parse(Deno.args);
