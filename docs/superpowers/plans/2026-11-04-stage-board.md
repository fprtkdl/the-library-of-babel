# 1-7 정적 보드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/stages/main_01-07` 페이지에 1-7 맵 격자와 샘플 공략의 배치(아바타 + 순번 + 방향)를 정적으로 그린다.

**Architecture:** 동기화 스크립트가 게임 데이터 원본에서 보드·오퍼레이터 매핑을 뽑아 `data/`에 저장하고 아바타를 `public/assets/`에 받는다. 순수 함수(`lib/`)가 공략 JSON을 배치 목록으로 바꾸고 검증한다. 서버 컴포넌트가 CSS Grid로 그린다.

**Tech Stack:** Next.js 16.4.5 (App Router, TypeScript), Vitest 5.1.0, tsx 4.23.15, Node 22.

## Global Constraints

- 설계 문서: `docs/superpowers/specs/2026-11-04-stage-board-design.md`
- 범위 밖: 단계 재생, 입력 기능, 사거리, 스킬 아이콘, 한국어 이름, Supabase, R2.
- 게임 이미지는 git에 넣지 않는다 (`public/assets/` gitignore).
- 런타임에 GitHub raw를 호출하지 않는다. 다운로드는 동기화 스크립트에서만.
- 사이트에 "비공식 팬 사이트, 데이터 출처: 명일방주 인게임 정보" 표기.
- **좌표계 (조사 완료)**: MAA `location: [x, y]` = `mapData.map[y][x]`. `map[0]`이 화면 맨 위 행.
  근거: 2-5 zoot.plus 공략 배치 37건이 이 해석에서만 전부 배치 가능 타일에 놓임 (뒤집으면 25건). ArknightsGameResource 타일 계산기도 `map` 행을 뒤집지 않고 0행을 위에 그림.
- **커밋: 각 Task 끝에서 그 Task 변경만 커밋 (사용자 승인, 기능 단위 분리).** 메시지 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. push 금지.

## 파일 구조

| 파일 | 책임 |
|---|---|
| `lib/board.ts` | 레벨 원본 → `StageBoard` |
| `lib/operators.ts` | character_table + 이름 목록 → `{ 이름: charId }` |
| `lib/strategy.ts` | 공략 + 보드 + 오퍼레이터 매핑 → `Placement[]` (검증 포함) |
| `scripts/sync-gamedata.ts` | 다운로드 + 위 함수 호출 + 파일 저장 |
| `data/strategies/main_01-07.sample.json` | 샘플 공략 (손으로 작성) |
| `data/stages/main_01-07.json`, `data/operators.json` | 스크립트 산출물 (git 포함) |
| `components/StageBoard.tsx` + `.module.css` | 타일 격자 |
| `components/DeployMarker.tsx` + `.module.css` | 아바타 + 순번 + 화살표 |
| `app/stages/[stageId]/page.tsx` | 정적 페이지 |

---

### Task 1: Next.js + Vitest 골격

**Files:**
- Create: create-next-app 산출물 전체, `.gitignore` 수정

**Interfaces:**
- Produces: `npm run dev`, `npm test`, `@/*` import alias (프로젝트 루트 기준)

- [ ] **Step 1: 임시 폴더에 생성 후 루트로 이동** (루트에 STATUS.md, docs/가 있어 직접 생성 시 충돌 가능)

```bash
cd ~/my_projects/the-library-of-babel
npx create-next-app@16.4.5 scaffold-tmp --ts --app --eslint --no-tailwind --no-src-dir --import-alias "@/*" --use-npm --yes
rsync -a scaffold-tmp/ ./ --exclude .git
rm -rf scaffold-tmp
```

- [ ] **Step 2: 테스트 도구 설치**

```bash
npm i -D vitest@5.1.0 tsx@4.23.15
```

- [ ] **Step 3: `package.json` scripts에 추가**

```json
"test": "vitest run",
"sync": "tsx scripts/sync-gamedata.ts",
"prebuild": "npm run sync"
```

- [ ] **Step 4: `.gitignore` 끝에 추가**

```
# 게임 이미지: sync 스크립트가 받아옴, git에 안 넣음
/public/assets/
```

- [ ] **Step 5: 확인**

Run: `npm run build`
Expected: 실패 — `scripts/sync-gamedata.ts` 없음 (Task 4에서 생성). `npx next build` 는 성공해야 함.

- [ ] **Step 6: 커밋** — `git status` 로 변경 목록만 확인. `git add` 이 Task 파일만 → `git commit -m "chore: scaffold Next.js app with Vitest"` (trailer 포함)

---

### Task 2: `lib/board.ts` — 레벨 원본 → 보드

**Files:**
- Create: `lib/board.ts`
- Test: `lib/board.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type Tile = { key: string; height: "LOWLAND" | "HIGHLAND"; buildable: "NONE" | "MELEE" | "RANGED" | "ALL" };
  type StageBoard = { stageId: string; width: number; height: number; tiles: Tile[][] }; // tiles[y][x], y=0 화면 위
  type RawLevel = { mapData: { map: number[][]; tiles: { tileKey: string; heightType: Tile["height"]; buildableType: Tile["buildable"] }[] } };
  function toStageBoard(stageId: string, raw: RawLevel): StageBoard
  ```

- [ ] **Step 1: 실패하는 테스트**

```ts
// lib/board.test.ts
import { describe, expect, it } from "vitest";
import { toStageBoard, type RawLevel } from "./board";

const raw: RawLevel = {
  mapData: {
    map: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    tiles: [
      { tileKey: "tile_wall", heightType: "HIGHLAND", buildableType: "RANGED" },
      { tileKey: "tile_road", heightType: "LOWLAND", buildableType: "MELEE" },
    ],
  },
};

describe("toStageBoard", () => {
  it("격자 크기를 map에서 읽는다", () => {
    const b = toStageBoard("test", raw);
    expect([b.stageId, b.width, b.height]).toEqual(["test", 3, 2]);
  });

  it("tiles[y][x]가 map[y][x]의 타일 정의를 가리킨다 (뒤집지 않음)", () => {
    const b = toStageBoard("test", raw);
    expect(b.tiles[0][0]).toEqual({ key: "tile_wall", height: "HIGHLAND", buildable: "RANGED" });
    expect(b.tiles[1][2].key).toBe("tile_wall");
    expect(b.tiles[1][0].key).toBe("tile_road");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- lib/board.test.ts`
Expected: FAIL — `Cannot find module './board'` 또는 동등한 에러

- [ ] **Step 3: 구현**

```ts
// lib/board.ts
export type Tile = {
  key: string;
  height: "LOWLAND" | "HIGHLAND";
  buildable: "NONE" | "MELEE" | "RANGED" | "ALL";
};

export type StageBoard = { stageId: string; width: number; height: number; tiles: Tile[][] };

export type RawLevel = {
  mapData: {
    map: number[][];
    tiles: { tileKey: string; heightType: Tile["height"]; buildableType: Tile["buildable"] }[];
  };
};

// map[0] = 화면 맨 위 행. MAA location [x, y] = map[y][x] 이라 뒤집지 않는다.
export function toStageBoard(stageId: string, raw: RawLevel): StageBoard {
  const { map, tiles } = raw.mapData;
  return {
    stageId,
    width: map[0].length,
    height: map.length,
    tiles: map.map((row) =>
      row.map((i) => ({ key: tiles[i].tileKey, height: tiles[i].heightType, buildable: tiles[i].buildableType })),
    ),
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- lib/board.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋** — `git add` 이 Task 파일만 → `git commit -m "feat: convert level map data to stage board"` (trailer 포함)

---

### Task 3: `lib/operators.ts`, `lib/strategy.ts` — 공략 → 배치 목록

**Files:**
- Create: `lib/operators.ts`, `lib/strategy.ts`
- Test: `lib/operators.test.ts`, `lib/strategy.test.ts`

**Interfaces:**
- Consumes: `StageBoard`, `Tile` from `lib/board.ts`
- Produces:
  ```ts
  // lib/operators.ts
  type CharacterTable = Record<string, { name: string }>;
  function findCharIds(table: CharacterTable, names: string[]): Record<string, string>
  // lib/strategy.ts
  type Direction = "Left" | "Right" | "Up" | "Down";
  type Placement = { order: number; charId: string; name: string; x: number; y: number; direction: Direction };
  type Copilot = { stage_name: string; opers: { name: string; skill?: number }[]; actions: { type?: string; name?: string; location?: [number, number]; direction?: string }[] };
  function toPlacements(copilot: Copilot, board: StageBoard, operators: Record<string, string>): Placement[]
  ```

- [ ] **Step 1: 실패하는 테스트**

```ts
// lib/operators.test.ts
import { describe, expect, it } from "vitest";
import { findCharIds } from "./operators";

const table = {
  token_10000_silent_healrb: { name: "芬" }, // char_ 아닌 항목은 무시
  char_123_fang: { name: "芬" },
  char_124_kroos: { name: "克洛丝" },
};

describe("findCharIds", () => {
  it("이름을 char_ 로 시작하는 ID에 매핑한다", () => {
    expect(findCharIds(table, ["芬", "克洛丝"])).toEqual({ 芬: "char_123_fang", 克洛丝: "char_124_kroos" });
  });

  it("없는 이름이면 에러", () => {
    expect(() => findCharIds(table, ["없음"])).toThrow("character_table에 없음: 없음");
  });
});
```

```ts
// lib/strategy.test.ts
import { describe, expect, it } from "vitest";
import type { StageBoard, Tile } from "./board";
import { toPlacements, type Copilot } from "./strategy";

const road: Tile = { key: "tile_road", height: "LOWLAND", buildable: "MELEE" };
const wall: Tile = { key: "tile_wall", height: "HIGHLAND", buildable: "RANGED" };
const none: Tile = { key: "tile_forbidden", height: "LOWLAND", buildable: "NONE" };
const board: StageBoard = { stageId: "t", width: 3, height: 2, tiles: [[wall, road, none], [road, road, road]] };
const ops = { 芬: "char_123_fang", 克洛丝: "char_124_kroos" };

const copilot = (actions: Copilot["actions"]): Copilot => ({ stage_name: "t", opers: [], actions });

describe("toPlacements", () => {
  it("Deploy만 골라 등장 순서대로 1부터 순번을 매긴다", () => {
    const p = toPlacements(
      copilot([
        { type: "Deploy", name: "克洛丝", location: [0, 0], direction: "Down" },
        { type: "SpeedUp" },
        { type: "Skill", name: "克洛丝" },
        { name: "芬", location: [1, 1], direction: "Right" }, // type 생략 = Deploy
      ]),
      board,
      ops,
    );
    expect(p).toEqual([
      { order: 1, charId: "char_124_kroos", name: "克洛丝", x: 0, y: 0, direction: "Down" },
      { order: 2, charId: "char_123_fang", name: "芬", x: 1, y: 1, direction: "Right" },
    ]);
  });

  it("location [x, y]는 tiles[y][x]로 검사한다", () => {
    // [2, 0] = tiles[0][2] = none → 실패, [0, 1] = tiles[1][0] = road → 통과
    expect(() => toPlacements(copilot([{ name: "芬", location: [2, 0], direction: "Up" }]), board, ops)).toThrow();
    expect(toPlacements(copilot([{ name: "芬", location: [0, 1], direction: "Up" }]), board, ops)).toHaveLength(1);
  });

  it("모르는 오퍼레이터면 에러", () => {
    expect(() => toPlacements(copilot([{ name: "없음", location: [1, 0], direction: "Up" }]), board, ops)).toThrow(
      "알 수 없는 오퍼레이터: 없음",
    );
  });

  it("격자 밖이면 에러", () => {
    expect(() => toPlacements(copilot([{ name: "芬", location: [3, 0], direction: "Up" }]), board, ops)).toThrow(
      "격자 밖 좌표: 芬 [3, 0]",
    );
  });

  it("배치 불가 타일이면 에러", () => {
    expect(() => toPlacements(copilot([{ name: "芬", location: [2, 0], direction: "Up" }]), board, ops)).toThrow(
      "배치 불가 타일: 芬 [2, 0]",
    );
  });

  it("방향이 없거나 잘못되면 에러", () => {
    expect(() => toPlacements(copilot([{ name: "芬", location: [1, 0] }]), board, ops)).toThrow("잘못된 방향: 芬");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- lib/operators.test.ts lib/strategy.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

```ts
// lib/operators.ts
export type CharacterTable = Record<string, { name: string }>;

export function findCharIds(table: CharacterTable, names: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of names) {
    // shortcut: 같은 이름 여러 형태(예: 阿米娅)면 첫 항목, 공략 형식에 형태 구분이 생기면 교체
    const id = Object.keys(table).find((k) => k.startsWith("char_") && table[k].name === name);
    if (!id) throw new Error(`character_table에 없음: ${name}`);
    out[name] = id;
  }
  return out;
}
```

```ts
// lib/strategy.ts
import type { StageBoard } from "./board";

export type Direction = "Left" | "Right" | "Up" | "Down";
export type Placement = { order: number; charId: string; name: string; x: number; y: number; direction: Direction };
export type Copilot = {
  stage_name: string;
  opers: { name: string; skill?: number }[];
  actions: { type?: string; name?: string; location?: [number, number]; direction?: string }[];
};

const DIRECTIONS: string[] = ["Left", "Right", "Up", "Down"];

export function toPlacements(copilot: Copilot, board: StageBoard, operators: Record<string, string>): Placement[] {
  return copilot.actions
    .filter((a) => ["Deploy", "部署"].includes(a.type ?? "Deploy")) // MAA는 type 생략 시 Deploy
    .map((a, i) => {
      const name = a.name ?? "";
      const charId = operators[name];
      if (!charId) throw new Error(`알 수 없는 오퍼레이터: ${name}`);
      const [x, y] = a.location ?? [-1, -1];
      const tile = board.tiles[y]?.[x];
      if (!tile) throw new Error(`격자 밖 좌표: ${name} [${x}, ${y}]`);
      if (tile.buildable === "NONE") throw new Error(`배치 불가 타일: ${name} [${x}, ${y}]`);
      if (!DIRECTIONS.includes(a.direction ?? "")) throw new Error(`잘못된 방향: ${name}`);
      return { order: i + 1, charId, name, x, y, direction: a.direction as Direction };
    });
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test`
Expected: PASS (board 2, operators 2, strategy 6)

- [ ] **Step 5: 커밋** — `git add` 이 Task 파일만 → `git commit -m "feat: convert copilot strategy to placements with validation"` (trailer 포함)

---

### Task 4: 샘플 공략 + 동기화 스크립트

**Files:**
- Create: `data/strategies/main_01-07.sample.json`, `scripts/sync-gamedata.ts`
- Generated (git 포함): `data/stages/main_01-07.json`, `data/operators.json`
- Generated (gitignore): `public/assets/avatar/*.png`
- Test: `lib/sample.test.ts`

**Interfaces:**
- Consumes: `toStageBoard`, `findCharIds`, `toPlacements`
- Produces: 위 데이터 파일들. `data/operators.json` 형식 `{ "芬": "char_123_fang", ... }`

1-7 맵 (y=0이 위, `#`=고지대 RANGED, `.`=길 MELEE, `x`=불가, `S`=시작, `E`=끝, `_`=바닥 불가):
```
y0 xxxxxxxxxxx
y1 x###....._S
y2 x#...####xx
y3 E..x....._S
y4 x#...####xx
y5 x###....._S
y6 xxxxxxxxxxx
```

- [ ] **Step 1: 샘플 공략 작성** (렌더링 확인용, 실제 클리어 검증 안 됨)

```json
{
  "stage_name": "main_01-07",
  "doc": { "title": "보드 렌더링 확인용 샘플", "details": "실제 클리어 검증 안 된 배치" },
  "opers": [
    { "name": "芬", "skill": 1 },
    { "name": "米格鲁", "skill": 1 },
    { "name": "克洛丝", "skill": 1 },
    { "name": "炎熔", "skill": 1 },
    { "name": "芙蓉", "skill": 1 },
    { "name": "玫兰莎", "skill": 1 }
  ],
  "actions": [
    { "type": "Deploy", "name": "芬", "location": [4, 3], "direction": "Right" },
    { "type": "Deploy", "name": "米格鲁", "location": [2, 3], "direction": "Right" },
    { "type": "Deploy", "name": "克洛丝", "location": [5, 2], "direction": "Down" },
    { "type": "Deploy", "name": "炎熔", "location": [6, 4], "direction": "Up" },
    { "type": "SpeedUp" },
    { "type": "Deploy", "name": "芙蓉", "location": [2, 1], "direction": "Down" },
    { "type": "Deploy", "name": "玫兰莎", "location": [5, 1], "direction": "Right" }
  ]
}
```

- [ ] **Step 2: 실패하는 테스트** (스크립트 산출물 + 샘플 통합 검증)

```ts
// lib/sample.test.ts
import { describe, expect, it } from "vitest";
import board from "../data/stages/main_01-07.json";
import operators from "../data/operators.json";
import sample from "../data/strategies/main_01-07.sample.json";
import type { StageBoard } from "./board";
import { toPlacements, type Copilot } from "./strategy";

describe("1-7 실제 데이터", () => {
  it("보드는 11x7, 왼쪽 가운데가 도착점", () => {
    const b = board as StageBoard;
    expect([b.width, b.height]).toEqual([11, 7]);
    expect(b.tiles[3][0].key).toBe("tile_end");
    expect(b.tiles[1][10].key).toBe("tile_start");
  });

  it("샘플 공략이 검증을 통과하고 배치 6개", () => {
    const p = toPlacements(sample as Copilot, board as StageBoard, operators);
    expect(p.map((x) => x.order)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(p[0]).toMatchObject({ charId: "char_123_fang", x: 4, y: 3, direction: "Right" });
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `npm test -- lib/sample.test.ts`
Expected: FAIL — `data/stages/main_01-07.json` 없음

- [ ] **Step 4: 스크립트 구현**

```ts
// scripts/sync-gamedata.ts
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
```

- [ ] **Step 5: 실행**

Run: `npm run sync`
Expected: `synced main_01-07: 6 avatars`, `ls public/assets/avatar` 에 png 6개

- [ ] **Step 6: 통과 확인**

Run: `npm test`
Expected: PASS (전체 12 tests)

- [ ] **Step 7: 커밋** — `git add` 이 Task 파일만 → `git commit -m "feat: add 1-7 sample strategy and game data sync script"` (trailer 포함)

---

### Task 5: 보드 화면

**Files:**
- Create: `components/StageBoard.tsx`, `components/StageBoard.module.css`, `components/DeployMarker.tsx`, `components/DeployMarker.module.css`, `app/stages/[stageId]/page.tsx`
- Modify: `app/page.tsx` (기본 내용 교체)

**Interfaces:**
- Consumes: `StageBoard`, `Placement`, `toPlacements`, Task 4 데이터 파일

- [ ] **Step 1: `components/DeployMarker.tsx`**

```tsx
import type { Placement } from "@/lib/strategy";
import styles from "./DeployMarker.module.css";

const ARROW = { Left: "←", Right: "→", Up: "↑", Down: "↓" } as const;

export function DeployMarker({ placement: p, hasAvatar }: { placement: Placement; hasAvatar: boolean }) {
  return (
    <div className={styles.marker} aria-label={`${p.order}번 ${p.name}, 방향 ${p.direction}`}>
      {hasAvatar ? (
        // eslint-disable-next-line @next/next/no-img-element -- 정적 소형 아이콘, 최적화 불필요
        <img className={styles.avatar} src={`/assets/avatar/${p.charId}.png`} alt={p.name} />
      ) : (
        <span className={styles.name}>{p.name}</span>
      )}
      <span className={styles.order}>{p.order}</span>
      <span className={styles.arrow} aria-hidden>
        {ARROW[p.direction]}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: `components/DeployMarker.module.css`**

```css
.marker { position: relative; width: 100%; height: 100%; display: grid; place-items: center; }
.avatar { width: 88%; height: 88%; object-fit: cover; border-radius: 4px; }
.name { font-size: 11px; color: #fff; text-align: center; }
.order {
  position: absolute; top: -6px; right: -6px; min-width: 20px; height: 20px; padding: 0 4px;
  border-radius: 10px; background: #e8b400; color: #111; font: 700 12px/20px system-ui; text-align: center;
}
.arrow {
  position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%);
  font: 700 16px/1 system-ui; color: #fff; text-shadow: 0 0 3px #000;
}
```

- [ ] **Step 3: `components/StageBoard.tsx`**

```tsx
import type { StageBoard as Board } from "@/lib/board";
import type { Placement } from "@/lib/strategy";
import { DeployMarker } from "./DeployMarker";
import styles from "./StageBoard.module.css";

export function StageBoard({ board, placements, avatars }: { board: Board; placements: Placement[]; avatars: Set<string> }) {
  return (
    <div className={styles.board} style={{ gridTemplateColumns: `repeat(${board.width}, var(--cell))` }}>
      {board.tiles.flatMap((row, y) =>
        row.map((tile, x) => {
          // shortcut: 한 칸에 배치 하나만 표시(첫 번째), 철수 후 재배치는 단계 재생(B)에서 처리
          const p = placements.find((q) => q.x === x && q.y === y);
          const cls = [styles.tile, styles[tile.key], tile.height === "HIGHLAND" && styles.high].filter(Boolean).join(" ");
          return (
            <div key={`${x},${y}`} className={cls} title={`${tile.key} [${x}, ${y}]`}>
              {p && <DeployMarker placement={p} hasAvatar={avatars.has(p.charId)} />}
            </div>
          );
        }),
      )}
    </div>
  );
}
```

- [ ] **Step 4: `components/StageBoard.module.css`**

```css
.board { --cell: clamp(24px, 7vw, 64px); display: grid; gap: 2px; padding: 8px; background: #1b1d22; width: max-content; max-width: 100%; }
.tile { width: var(--cell); height: var(--cell); background: #3a3d44; }
.high { box-shadow: inset 0 -4px 0 rgba(0, 0, 0, 0.35); }
.tile_road { background: #8a8f99; }
.tile_wall { background: #5d7a99; }
.tile_floor { background: #55585f; }
.tile_forbidden { background: #26282d; }
.tile_start { background: #b8433a; }
.tile_end { background: #3a6fb8; }
```

- [ ] **Step 5: `app/stages/[stageId]/page.tsx`**

```tsx
import { existsSync } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { StageBoard } from "@/components/StageBoard";
import type { StageBoard as Board } from "@/lib/board";
import { toPlacements, type Copilot } from "@/lib/strategy";
import board from "@/data/stages/main_01-07.json";
import operators from "@/data/operators.json";
import sample from "@/data/strategies/main_01-07.sample.json";

export const dynamicParams = false;
export function generateStaticParams() {
  return [{ stageId: "main_01-07" }];
}

export default async function StagePage({ params }: { params: Promise<{ stageId: string }> }) {
  const { stageId } = await params;
  if (stageId !== "main_01-07") notFound();

  const placements = toPlacements(sample as Copilot, board as Board, operators);
  const avatars = new Set(
    placements
      .map((p) => p.charId)
      .filter((id) => existsSync(path.join(process.cwd(), "public/assets/avatar", `${id}.png`))),
  );

  return (
    <main style={{ padding: 16 }}>
      <h1>1-7</h1>
      <p>{sample.doc.title}</p>
      <StageBoard board={board as Board} placements={placements} avatars={avatars} />
      <footer style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
        비공식 팬 사이트. 데이터 출처: 명일방주 인게임 정보.
      </footer>
    </main>
  );
}
```

- [ ] **Step 6: `app/page.tsx` 교체**

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 16 }}>
      <h1>바벨의 도서관</h1>
      <Link href="/stages/main_01-07">1-7 보드</Link>
    </main>
  );
}
```

- [ ] **Step 7: 빌드·테스트**

Run: `npm test && npm run build`
Expected: 테스트 PASS, 빌드 성공, 출력에 `/stages/main_01-07` 정적 페이지 포함

- [ ] **Step 8: 화면 확인**

Run: `npm run dev` → `http://localhost:3000/stages/main_01-07`
Expected:
- 11x7 격자, 왼쪽 가운데 파란 칸(도착), 오른쪽 세 칸 빨간 칸(시작)
- 배치 6개: 芬 [4,3] 1번 →, 米格鲁 [2,3] 2번 →, 克洛丝 [5,2] 3번 ↓, 炎熔 [6,4] 4번 ↑, 芙蓉 [2,1] 5번 ↓, 玫兰莎 [5,1] 6번 →
- 폭 375px에서도 가로 스크롤 없음

- [ ] **Step 9: 커밋** — STATUS.md "현재 단계" 갱신. `git add` 이 Task 파일만 → `git commit -m "feat: render 1-7 stage board page"` (trailer 포함)
