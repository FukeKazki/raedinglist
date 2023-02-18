#!/usr/bin/env -S deno run -A

import { Command } from "cliffy/command/mod.ts";
import { Cell, Table } from "cliffy/table/mod.ts";
import { basename, extname, fromFileUrl, join, normalize } from "std";
import { parse } from "https://deno.land/std@0.177.0/datetime/mod.ts";

const displayReadingList = async () => {
  // どこから実行しても ~/readinglist/を参照できるように
  const filePath = fromFileUrl(import.meta.url);
  const path = normalize(join(filePath, "../", "../"));

  const files: string[] = [];

  // "yyyymmdd.md"なファイル取り出す
  for await (const dirEntry of Deno.readDir(path)) {
    if (dirEntry.isDirectory) continue;
    if (dirEntry.name === "README.md") continue;
    files.push(path + dirEntry.name);
  }

  // 出力用のテーブルを作成
  const table: Table = new Table()
    .header(["date", "title", "url"])
    .body([])
    .border(true)
    .sort();

  // 日付け順にソート
  files.sort();
  // titleとurlを取り出す
  for (const file of files) {
    const res = await Deno.readTextFile(file);
    // ファイル名から日付を取り出す
    const dateMatcher =
      /(?<year>[0-9]{4})(?<month>[0-9]{2})(?<date>[0-9]{2}).md/;
    const { year, month, date } = basename(file).match(dateMatcher)?.groups;

    const line = res.split("\n");
    line.map((str, index) => {
      if (str === "") return;
      const urlMatcher = /(?<url>https?:\/\/[\w/:%#\$&\?~\.=\+\-]+)/;
      const url = str.match(urlMatcher)?.groups?.url;
      const titleMatcher = /\[(?<title>.+)\]/;
      const title = str.match(titleMatcher)?.groups?.title;
      if (!url || !title) return;
      const rows = [];
      if (index === 0) {
        rows.push(
          new Cell(`${year}/${month}/${date}`).rowSpan(line.length - 1),
        );
      }
      rows.push(title);
      rows.push(url);
      table.push(rows);
    });
  }
  table.render();
};

const pullReadingList = async () => {
  console.log("git pull");
  const p = Deno.run({
    cmd: ["git", "pull"],
  });
  await p.status();
  p.close();
};

const convert = async () => {
  const filePath = fromFileUrl(import.meta.url);
  const path = normalize(join(filePath, "../", "../"));

  const files: string[] = [];

  // "yyyymmdd.md"なファイル取り出す
  for await (const dirEntry of Deno.readDir(path)) {
    if (dirEntry.isDirectory) continue;
    if (dirEntry.name === "README.md") continue;
    if (extname(dirEntry.name) === ".json") continue;
    files.push(path + dirEntry.name);
  }
  console.log(files);
  for (const file of files) {
    const res = await Deno.readTextFile(file);
    const dateMatcher =
      /(?<year>[0-9]{4})(?<month>[0-9]{2})(?<date>[0-9]{2}).md/;
    const { year, month, date } = basename(file).match(dateMatcher)?.groups;
    const path = `${year}${month}${date}.json`;

    const list: any[] = [];
    const line = res.split("\n");
    line.map((str) => {
      if (str === "") return;
      const urlMatcher = /(?<url>https?:\/\/[\w/:%#\$&\?~\.=\+\-]+)/;
      const url = str.match(urlMatcher)?.groups?.url;
      const titleMatcher = /\[(?<title>.+)\]/;
      const title = str.match(titleMatcher)?.groups?.title;
      if (!url || !title) return;
      list.push({
        date: `${year}-${month}-${date}`,
        title,
        url,
        memo: "",
      });
    });

    await Deno.writeTextFile(
      path,
      JSON.stringify(list),
      {
        create: true,
      },
    );
  }
};

await new Command()
  .name("reading")
  .version("0.1.0")
  .description("readinglistを閲覧するためのCLIです")
  .action((_options, ..._args) => displayReadingList())
  .command("update", "Update command.")
  .action((_option, ..._args) => pullReadingList())
  .command("convert", "markdown convert json")
  .action((_option, ..._args) => convert())
  .parse(Deno.args);
