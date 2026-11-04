import { mkdir, readFile, writeFile } from "node:fs/promises";
import { toStageBoard } from "../lib/board";
import { findCharIds } from "../lib/operators";

const GAMEDATA = "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata";
const RESOURCE = "https://raw.githubusercontent.com/yuanyan3060/ArknightsGameResource/main";
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
  const avatars = await Promise.all(
    Object.values(operators).map(async (id) => [id, Buffer.from(await (await get(`${RESOURCE}/avatar/${id}.png`)).arrayBuffer())] as const),
  );

  // 다운로드가 전부 끝난 뒤에만 쓴다: 실패 시 기존 파일 유지
  await mkdir("data/stages", { recursive: true });
  await mkdir("public/assets/avatar", { recursive: true });
  await writeFile(`data/stages/${STAGE}.json`, JSON.stringify(toStageBoard(STAGE, level)));
  await writeFile("data/operators.json", JSON.stringify(operators, null, 2) + "\n");
  for (const [id, buf] of avatars) await writeFile(`public/assets/avatar/${id}.png`, buf);
  console.log(`synced ${STAGE}: ${avatars.length} avatars`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
