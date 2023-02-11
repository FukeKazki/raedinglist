#!/usr/bin/env -S deno run -A

import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
// import { Table } from "https://deno.land/x/cliffy@v0.25.7/table/mod.ts";
import { Table } from "https://raw.githubusercontent.com/FukeKazki/deno-cliffy/main/table/mod.ts";

const displayReadingList = async () => {
  console.log("hello");
  const files = [];
  for await (const dirEntry of Deno.readDir("../")) {
    if (dirEntry.isDirectory) continue;
    if (dirEntry.name === "README.md") continue;
    files.push("../" + dirEntry.name);
  }

  const table: Table = new Table()
    .header(["title", "url"])
    .body([])
    .border(true);

  for (const file of files) {
    const res = await Deno.readTextFile(file);
    res.split("\n").map((str) => {
      if (str === "") return;
      const urlMatcher = /(?<url>https?:\/\/[\w/:%#\$&\?~\.=\+\-]+)/;
      const url = str.match(urlMatcher)?.groups?.url;
      const titleMatcher = /\[(?<title>.+)\]/;
      const title = str.match(titleMatcher)?.groups?.title;
      if (!url || !title) return;
      table.push([title, url]);
    });
  }
  table.render()
};

await new Command()
  .name("reading")
  .version("0.1.0")
  .description("readinglistを閲覧するためのCLIです")
  .action((_options, ..._args) => displayReadingList())
  .parse(Deno.args);
