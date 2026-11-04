import { mkdir, readFile, writeFile } from "node:fs/promises";
import { downloadAvatars } from "./avatars";
import { toStageBoard } from "../lib/board";
import { findCharIds } from "../lib/operators";

const GAMEDATA = "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata";
const STAGE = "main_01-07";

async function get(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

async function main() {
  const level = await (await get(`${GAMEDATA}/levels/obt/main/level_${STAGE}.json`)).json();
  const table = await (await get(`${GAMEDATA}/excel/character_table.json`)).json();
  const copilot = JSON.parse(await readFile(`data/strategies/${STAGE}.sample.json`, "utf8"));
  const operators = findCharIds(table, copilot.opers.map((o: { name: string }) => o.name));

  await mkdir("data/stages", { recursive: true });
  await writeFile(`data/stages/${STAGE}.json`, JSON.stringify(toStageBoard(STAGE, level)));
  await writeFile("data/operators.json", JSON.stringify(operators, null, 2) + "\n");
  await downloadAvatars(Object.values(operators));
  console.log(`synced ${STAGE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
