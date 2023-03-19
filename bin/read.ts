#!/usr/bin/env -S deno run -A

import { Command } from "cliffy/command/mod.ts";
import { Cell, Table } from "cliffy/table/mod.ts";
import { Select } from "https://deno.land/x/cliffy@v0.25.7/prompt/select.ts";
import { basename, extname, fromFileUrl, join, normalize } from "std";

export const useCommand = async (cmd: string[]) => {
  const p = Deno.run({
    cmd,
    "stderr": "piped",
    "stdout": "piped",
  });

  const [status, stdout, stderror] = await Promise.all([
    p.status(),
    p.output(),
    p.stderrOutput(),
  ]);

  return {
    status,
    stdout: new TextDecoder().decode(stdout),
    stderror: new TextDecoder().decode(stderror),
  };
};

export const getTitleKeyFile = async () => {
  const files = await getFiles("desc");
  const response = new Map();
  for (const file of files) {
    const res = await Deno.readTextFile(file);
    const json = JSON.parse(res);
    json.forEach((v) => {
      response.set(v.title, file);
    });
  }
  return response;
};

export const getFiles = async (sort = "asc") => {
  // どこから実行しても ~/readinglist/を参照できるように
  const filePath = fromFileUrl(import.meta.url);
  const path = normalize(join(filePath, "../", "../"));

  let files: string[] = [];

  // "yyyymmdd.md"なファイル取り出す
  for await (const dirEntry of Deno.readDir(path)) {
    if (dirEntry.isDirectory) continue;
    if (dirEntry.name === "README.md") continue;
    if (extname(dirEntry.name) === ".md") continue;
    files.push(path + dirEntry.name);
  }
  // 日付け順にソート
  files.sort();
  if (sort === "asc") {
  } else {
    files = files.reverse();
  }

  return files;
};

const edit = async () => {
  const files = await getFiles("desc");
  const response = [];
  for (const file of files) {
    const res = await Deno.readTextFile(file);
    const json = JSON.parse(res);
    response.push(json);
  }
  const titles = response.flat().map((data) => {
    return data!.title as string;
  });

  const title = await Select.prompt({
    message: "select title",
    options: titles,
  });
  const fileMap = await getTitleKeyFile();
  const file = fileMap.get(title);
  console.log(file);
  const prevData = await Deno.readTextFile(file);
  const prevJson = JSON.parse(prevData);
  const newJSON = prevJson.filter((v) => v.title !== title);
  console.log(newJSON);
  await Deno.writeTextFile(file, JSON.stringify(newJSON));
  // ファイルを読み取る
  // ファイルから該当オブジェクトを消す filter
  // 書き込む
};

const displayReadingList = async () => {
  // 出力用のテーブルを作成
  const table: Table = new Table()
    .header(["date", "title", "url", "memo"])
    .body([])
    .border(true)
    .maxColWidth(100)
    .sort();

  type JSON = [{
    date: string;
    title: string;
    url: string;
    memo: string;
  }];

  const files = await getFiles();
  // titleとurlを取り出す
  for (const file of files) {
    const res = await Deno.readTextFile(file);
    const json = JSON.parse(res) as JSON;
    json.map((obj, index) => {
      const url = obj.url;
      const title = obj.title;
      const date = obj.date;
      const rows = [];
      if (index === 0) {
        rows.push(
          new Cell(date).rowSpan(json.length),
        );
      }
      rows.push(title);
      rows.push(url);
      rows.push(obj.memo);
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

if (import.meta.main) {
  await new Command()
    .name("reading")
    .version("0.1.0")
    .description("readinglistを閲覧するためのCLIです")
    .action((_options, ..._args) => displayReadingList())
    .command("update", "Update command.")
    .action((_option, ..._args) => pullReadingList())
    .command("convert", "markdown convert json")
    .action((_option, ..._args) => convert())
    .command("edit", "Edit")
    .action(() => edit())
    .parse(Deno.args);
}
