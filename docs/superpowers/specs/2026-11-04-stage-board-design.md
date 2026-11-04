# 1단계: 1-7 정적 보드 설계

## 목표

1-7 맵 격자 위에 공략 하나의 배치를 보여준다.
각 배치는 오퍼레이터 아바타 + 배치 순번 숫자 + 방향 화살표.

성공 기준: `/stages/main_01-07` 페이지에서 샘플 공략의 모든 배치가 맞는 칸에, 맞는 순번·방향으로 보인다.

## 범위 밖

단계 재생, 입력 기능, 사거리 표시, 스킬 아이콘, 한국어 이름, Supabase, R2.

## 스택

Next.js (App Router, TypeScript), Vitest. 배포 Vercel.

## 데이터

### 출처

- 레벨: `Kengxxiao/ArknightsGameData` `zh_CN/gamedata/levels/obt/main/level_main_01-07.json`
- 오퍼레이터 이름↔ID: 같은 저장소 `zh_CN/gamedata/excel/character_table.json`
- 아바타: `yuanyan3060/ArknightsGameResource` `avatar/<charId>.png`

### 동기화 스크립트 `scripts/sync-gamedata.ts`

`npm run sync` 로 실행. `prebuild`에도 연결.

1. 레벨 원본에서 보드 데이터만 추출해 `data/stages/main_01-07.json` 저장 (git 포함).
   ```ts
   type StageBoard = {
     stageId: string;            // "main_01-07"
     width: number; height: number;
     tiles: Tile[][];            // tiles[y][x], y=0이 화면 맨 위
   };
   type Tile = {
     key: string;                // "tile_road" 등
     height: "LOWLAND" | "HIGHLAND";
     buildable: "NONE" | "MELEE" | "RANGED" | "ALL";
   };
   ```
2. 샘플 공략에 나온 오퍼레이터 이름을 `character_table`로 charId에 매핑해 `data/operators.json` 저장 (git 포함, 공략에 쓰인 것만).
3. 해당 아바타만 받아 `public/assets/avatar/<charId>.png` 저장 (gitignore).

### 공략 샘플 `data/strategies/main_01-07.sample.json`

MAA copilot 형식의 부분집합. Claude가 작성한다 (사용자 작업 아님).

```json
{
  "stage_name": "main_01-07",
  "opers": [{ "name": "能天使", "skill": 1 }],
  "actions": [
    { "type": "Deploy", "name": "能天使", "location": [5, 3], "direction": "Left" }
  ]
}
```

- 사용하는 필드: `stage_name`, `opers[].name`, `actions[]`의 `type`, `name`, `location`, `direction`.
- `type`이 `Deploy`가 아닌 액션은 무시.
- 배치 순번 = `Deploy` 액션의 등장 순서 (1부터).

### 좌표계 (2026-11-04 확정)

MAA `location: [x, y]` = `mapData.map[y][x]`, `map[0]`이 화면 맨 위 행.
근거: 2-5 zoot.plus 공략 배치 37건이 이 해석에서만 전부 배치 가능 타일 (뒤집으면 25건). 1-7은 상하대칭이라 판별 불가였음.
`lib/board.test.ts`, `lib/strategy.test.ts`에 고정.

## 컴포넌트

- `lib/board.ts`: 레벨 원본 → `StageBoard` 변환 (스크립트에서 사용).
- `lib/strategy.ts`: 공략 JSON + `StageBoard` + operators → `Placement[]` 변환·검증.
  ```ts
  type Placement = { order: number; charId: string; name: string; x: number; y: number; direction: "Left" | "Right" | "Up" | "Down" };
  ```
- `components/StageBoard.tsx`: CSS Grid로 타일 렌더링. 타일 종류별 색, 고지대/지면 명암 구분.
- `components/DeployMarker.tsx`: 아바타 + 우상단 순번 숫자 + 방향 화살표.
- `app/stages/[stageId]/page.tsx`: 정적 생성. 현재 `main_01-07`만.

## 에러 처리

| 상황 | 처리 |
|---|---|
| 공략의 오퍼레이터가 `operators.json`에 없음 | 빌드 실패 |
| 좌표가 격자 밖 | 빌드 실패 |
| 배치 불가 타일(`buildable: NONE`)에 배치 | 빌드 실패 |
| 아바타 이미지 없음 | 이름 텍스트로 대체 |
| 동기화 중 네트워크 실패 | 스크립트 실패, 기존 파일 유지 |

## 테스트

- Vitest `lib/board.test.ts`: 1-7 원본 → 11x7, 알려진 칸의 타일 종류 확인.
- Vitest `lib/strategy.test.ts`: 순번 부여, 비-Deploy 무시, 좌표 변환, 세 가지 검증 실패.
- 화면: `npm run dev` 후 직접 확인.
