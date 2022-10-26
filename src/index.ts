#! /usr/bin/env node

import fs, { mkdirSync } from "fs";
import { ensureDirSync } from "fs-extra";
import ytdl from "ytdl-core";
import ytpl from "ytpl";

import yargs from "yargs";
import { join } from "path";

const usage = `
yts-dl [options]
`;

const options = yargs
  .usage(usage)
  .option("p", {
    alias: "path",
    describe: "Directory path to download files.",
    demandOption: false,
    type: "string",
  })
  .option("u", {
    alias: "url",
    describe: "URL of a channel or a playlist to download",
    demandOption: true,
    type: "string",
  })
  .help(true);

let argv = options.argv as any;

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
function replaceAll(str: string, match: string, replacement: string) {
  return str.replace(new RegExp(escapeRegExp(match), "g"), () => replacement);
}

async function download(url: string, outputFolder: string) {
  let title = (await ytdl.getInfo(url)).videoDetails.title;

  title = replaceAll(title, "/", "_");
  title = replaceAll(title, "#", "_");
  title = replaceAll(title, "<", "_");
  title = replaceAll(title, "%", "_");
  title = replaceAll(title, ">", "_");
  title = replaceAll(title, "&", "_");
  title = replaceAll(title, "*", "_");
  title = replaceAll(title, "{", "_");
  title = replaceAll(title, "?", "_");
  title = replaceAll(title, "}", "_");
  title = replaceAll(title, "\\", "_");
  title = replaceAll(title, "$", "_");
  title = replaceAll(title, "+", "_");
  title = replaceAll(title, "!", "_");
  title = replaceAll(title, "`", "_");
  title = replaceAll(title, "'", "_");
  title = replaceAll(title, "|", "_");
  title = replaceAll(title, '"', "_");
  title = replaceAll(title, "=", "_");
  title = replaceAll(title, ":", "_");
  title = replaceAll(title, "@", "_");

  console.log(`Video Name : ${title}`);

  let stream: fs.WriteStream;

  if (argv.p) {
    stream = fs.createWriteStream(join(argv.p, `${title}.wav`));
  } else {
    stream = fs.createWriteStream(`${outputFolder}/${title}.wav`);
  }

  await ytdl(url, {
    filter: "audioonly",
  }).pipe(stream);
}

(async function () {
  let playlistF;

  try {
    playlistF = await ytpl(argv.u);
  } catch (e) {
    console.error("Error", "/", (e as any).message);
    process.exit();
  }
  const playlist = playlistF.items;

  try {
    if (argv.p) {
      ensureDirSync(argv.p);
    } else {
      ensureDirSync(playlistF.title);
    }
  } catch (e) {}

  for (let i = 0; i < playlist.length; i++) {
    console.log(`Start Downloading... ${i + 1} / ${playlist.length}`);
    await download(playlist[i].shortUrl, playlistF.title);
  }
})();
