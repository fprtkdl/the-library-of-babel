// 전 스테이지 보드 + 인덱스 + 샘플 공략 오퍼레이터 매핑 생성. 결과물(data/)은 커밋한다.
// 원본은 .cache/gamedata/ 에 받아 두고 재실행 시 재사용 (약 300MB, gitignore).
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { toStageBoard, type RawLevel } from "../lib/board";
import { findCharIds } from "../lib/operators";
import { buildStageIndex, type RawTables, type StageIndex } from "../lib/stage-index";
import { GAMEDATA, GAMEDATA_KO } from "./sources";

const CACHE = ".cache/gamedata";
const SAMPLE_STAGE = "main_01-07";
const CONCURRENCY = 12;

async function cached(base: string, rel: string): Promise<string> {
  const file = path.join(CACHE, base === GAMEDATA_KO ? "ko" : "zh", rel);
  try {
    return await readFile(file, "utf8");
  } catch {
    const url = `${base}/${rel}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    const text = await res.text();
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, text);
    return text;
  }
}
const json = async <T>(base: string, rel: string): Promise<T> => JSON.parse(await cached(base, rel));

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

async function main() {
  const [stageTable, zoneTable, activityTable, koStage, koZone, koActivity, characterTable] = await Promise.all([
    json<{ stages: RawTables["stages"] }>(GAMEDATA, "excel/stage_table.json"),
    json<{ zones: RawTables["zones"] }>(GAMEDATA, "excel/zone_table.json"),
    json<{ basicInfo: RawTables["activities"]; zoneToActivity: Record<string, string> }>(GAMEDATA, "excel/activity_table.json"),
    json<{ stages: RawTables["ko"]["stages"] }>(GAMEDATA_KO, "excel/stage_table.json"),
    json<{ zones: RawTables["ko"]["zones"] }>(GAMEDATA_KO, "excel/zone_table.json"),
    json<{ basicInfo: RawTables["ko"]["activities"] }>(GAMEDATA_KO, "excel/activity_table.json"),
    json<Parameters<typeof findCharIds>[0]>(GAMEDATA, "excel/character_table.json"),
  ]);

  const index = buildStageIndex({
    stages: stageTable.stages,
    zones: zoneTable.zones,
    activities: activityTable.basicInfo,
    zoneToActivity: activityTable.zoneToActivity,
    ko: { stages: koStage.stages, zones: koZone.zones, activities: koActivity.basicInfo },
  });

  // 보드: 일반 난이도마다 레벨 파일 하나. 실패한 것은 인덱스에서도 뺀다.
  await mkdir("data/stages", { recursive: true });
  const boards = index.stages.filter((s) => !s.hard);
  const failed = new Set<string>();
  let done = 0;
  await mapLimit(boards, CONCURRENCY, async (s) => {
    const levelId = stageTable.stages[s.id].levelId!;
    try {
      const level = await json<RawLevel>(GAMEDATA, `levels/${levelId.toLowerCase()}.json`);
      if (!level.mapData?.map?.length) throw new Error("mapData 없음");
      await writeFile(`data/stages/${s.id}.json`, JSON.stringify(toStageBoard(s.id, level)));
    } catch (e) {
      failed.add(s.id);
      console.warn(`skip ${s.id}: ${(e as Error).message}`);
    }
    if (++done % 200 === 0) console.log(`${done}/${boards.length}`);
  });
  const stages = index.stages.filter((s) => !failed.has(s.board));
  const used = new Set(stages.map((s) => s.zone));
  const final: StageIndex = { zones: index.zones.filter((z) => used.has(z.id)), stages };
  await writeFile("data/stages/index.json", JSON.stringify(final));
  // 이번 목록에서 빠진 보드 파일 정리
  const keep = new Set([...boards.map((s) => `${s.id}.json`), "index.json"]);
  await Promise.all((await readdir("data/stages")).filter((f) => !keep.has(f)).map((f) => unlink(`data/stages/${f}`)));

  // 샘플 공략의 오퍼레이터 이름 → charId
  const copilot = JSON.parse(await readFile(`data/strategies/${SAMPLE_STAGE}.sample.json`, "utf8"));
  const operators = findCharIds(characterTable, copilot.opers.map((o: { name: string }) => o.name));
  await writeFile("data/operators.json", JSON.stringify(operators, null, 2) + "\n");

  const hard = stages.filter((s) => s.hard).length;
  console.log(`synced: zones ${final.zones.length}, stages ${stages.length} (hard ${hard}), boards ${boards.length - failed.size}, skipped ${failed.size}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
