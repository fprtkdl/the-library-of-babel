import { mkdir, writeFile } from "node:fs/promises";
import { GAMEDATA, RESOURCE } from "./sources";

// 게임 이미지 전체를 public/assets/에 받아 git에 넣는다. 수동 실행(npm run sync:assets), 결과물 커밋.
async function json(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

// 없는 파일(404)은 세기만 한다: trap 중 다수는 원본에 이미지가 없고, 페이지가 이름 텍스트로 대체한다
async function grab(dir: string, names: string[]) {
  await mkdir(`public/assets/${dir}`, { recursive: true });
  let ok = 0;
  let missing = 0;
  for (let i = 0; i < names.length; i += 25) {
    await Promise.all(
      names.slice(i, i + 25).map(async (name) => {
        const res = await fetch(`${RESOURCE}/${dir}/${name}.png`);
        if (!res.ok) {
          missing++;
          return;
        }
        await writeFile(`public/assets/${dir}/${name}.png`, Buffer.from(await res.arrayBuffer()));
        ok++;
      }),
    );
  }
  console.log(`${dir}: ${ok} saved, ${missing} missing`);
}

async function main() {
  const chars = await json(`${GAMEDATA}/excel/character_table.json`);
  const skills = await json(`${GAMEDATA}/excel/skill_table.json`);
  const enemies = await json(`${GAMEDATA}/excel/enemy_handbook_table.json`);

  // char_(오퍼레이터) + token_(소환물) + trap_(필드 오브젝트·기믹)
  await grab("avatar", Object.keys(chars));
  const icons = Object.values(skills as Record<string, { skillId: string; iconId: string | null }>).map(
    (s) => `skill_icon_${s.iconId ?? s.skillId}`,
  );
  await grab("skill", [...new Set(icons)]);
  await grab("enemy", Object.keys(enemies.enemyData));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
