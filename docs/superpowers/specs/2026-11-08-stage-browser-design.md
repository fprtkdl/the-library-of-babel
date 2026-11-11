# 스테이지 탐색 설계 (전 스테이지 목록·검색)

## 목표

막힌 스테이지를 10초 안에 찾는다. 코드("4-10", "H6-4", "TL-EX-8"), 한국어 이름, 이벤트 이름 중 아무거나로.

성공 기준:
- `/stages`에서 "4-10" 입력 → 해당 칩 하나가 즉시 뜬다. "h64" 처럼 하이픈·대소문자 틀려도 H6-4가 뜬다.
- 에피소드 4 섹션을 펼치면 4-1 … 4-10 이 게임 순서대로 보인다.
- 이벤트 섹션은 최신 이벤트가 맨 위.
- 칩을 누르면 기존 보드 페이지가 열린다 (전 스테이지 보드 파일 존재).

## 범위 밖

공략 수 표시(공략 DB 이후), 맵 썸네일, 적 구성·코스트 등 상세 정보, 하드 모드 토글 UI(인덱스에는 포함), 로그라이크·보안파견·자원수급·훈련·튜토리얼·스토리 전용 스테이지.

## 데이터 (2026-11-08 조사)

출처: `Kengxxiao/ArknightsGameData` zh_CN `excel/stage_table.json`, `zone_table.json`, `activity_table.json`, `levels/**`.
한국어: `Kengxxiao/ArknightsGameData_YoStar` ko_KR 같은 파일들 (한국 서버 기준, 중국 서버보다 늦음).

| 항목 | 수치 |
|---|---|
| zh 스테이지 전체 | 3,658 (ko 2,894) |
| 포함 규칙 적용 후 | 3,174 = MAIN 666 + SUB 87 + ACTIVITY 2,384 + CAMPAIGN(섬멸전) 37 |
| 그중 하드(`#f#`) | 788. 전부 일반 난이도와 `levelId` 동일 → 보드 파일 공유 |
| 보드 파일 | 약 2,390개. 1-7 기준 4.8KB, 큰 맵 ~15KB → 합계 ~25MB |
| 원본 레벨 파일 | obt 2,098개 256MB + activities 1,927개 248MB (변환 전, 커밋 안 함) |

포함 규칙: `stageType ∈ {MAIN, SUB, ACTIVITY, CAMPAIGN}` 이고 `levelId` 있고 `isStoryOnly` 아님.

### 인덱스 `data/stages/index.json` (git 포함)

```ts
type StageIndex = { zones: Zone[]; stages: StageMeta[] };   // zones는 표시 순서
type Zone = {
  id: string;                         // "main_4" | "act55side" | "campaign"
  kind: "main" | "event" | "campaign";
  title: string;                      // "에피소드 4" | 이벤트명 | "섬멸전"
  subtitle?: string;                  // "급성쇠약"
  startTime?: number;                 // 이벤트 시작(unix). 최신순 정렬용
};
type StageMeta = {
  id: string;        // "main_04-10"  (하드는 "main_04-10#f#")
  code: string;      // "4-10"
  name: string;      // 한국어, 없으면 중국어
  nameZh: string;
  zone: string;      // Zone.id
  board: string;     // 보드 파일 id. 하드는 일반 id
  hard?: true;
  kr: boolean;       // 한국 서버 출시 여부
};
```

- **main**: zone_table `MAINLINE` 15개(프롤로그, 에피소드 1~14), `zoneIndex` 순. 제목·부제는 ko zone_table (`에피소드 4` / `급성쇠약`). SUB(S3-1 등)는 `zoneId`가 가리키는 에피소드 아래 붙인다 (구현 때 검증).
- **event**: `activity_table.zoneToActivity`로 zone → activity 묶음. 이름은 ko `basicInfo[act].name`, 없으면 zh. `startTime` 내림차순. 한 이벤트의 zone 여러 개는 합쳐서 코드 순.
- **campaign**: 섬멸전 37개 한 섹션.
- 정렬 키: 스테이지는 stage_table 등장 순서(게임 순서와 일치).

### 보드 파일 `data/stages/<boardId>.json`

기존 `StageBoard` 형식 그대로. 하드는 파일 없음 (`board`로 일반 파일 참조).

### 동기화 `scripts/sync-gamedata.ts`

1. 원본 500MB를 파일 3천 번 받지 않고 sparse clone: `git clone --depth 1 --filter=blob:none --sparse` 후 `zh_CN/gamedata/levels`, `zh_CN/gamedata/excel` 만 체크아웃. 임시 폴더, 커밋 안 함.
2. 포함 규칙으로 스테이지 선별 → 보드 변환 → `index.json` 생성.
3. 기존 `data/operators.json` 생성 로직 유지.

## UI

### `/stages`

- 맨 위 검색창 하나. 입력 즉시 필터, 서버 왕복 없음. 코드·한국어·중국어 부분일치. 코드 비교는 하이픈·공백·대소문자 제거("h64" = "H6-4").
- 검색어 있으면: 평면 칩 목록, 최대 50개. 검색어는 `?q=`로 URL에 유지 (공유·뒤로가기).
- 검색어 없으면 섹션 보기:
  1. **메인 스토리**: 에피소드별 `<details>` (네이티브 접기, JS 없음). 헤더 "에피소드 4 · 급성쇠약 · 4-1 ~ 4-10". 기본 전부 접힘.
  2. **이벤트**: 최신순 `<details>`. 헤더 "이벤트명 · 2026-10 · 25개".
  3. **섬멸전**: 칩 37개 펼친 채로.
- 칩: 코드 굵게 + 한국어 이름 작게 (기존 `.btn.btn-paper` 재사용). `kr: false`면 중국어 이름 + "KR 미출시" 뱃지.
- 하드 칩은 목록에 안 보임. 보드 페이지에서 "하드 모드 공략" 링크로 진입 (2단계).

### `/stages/[stageId]`

- 헤더: 코드 + 이름 + 소속(에피소드/이벤트). 이전/다음 스테이지 링크.
- 데이터는 `import` 대신 서버에서 `data/stages/<board>.json` fs 읽기. `generateStaticParams`로 전부 정적 생성. 빌드가 너무 길어지면 dynamic + 캐시로 전환.

## 컴포넌트

- `scripts/sync-gamedata.ts`: 전 스테이지 처리 (위).
- `lib/stage-index.ts`: 인덱스 타입·로드, `normalizeCode()`, `searchStages(index, q)`. 테스트: "4-10"/"h64"/"폭군"/"暴君" 각각 1건, 빈 문자열은 0건.
- `components/StageSearch.tsx` (클라이언트): 검색창 + 결과 칩. 받는 데이터는 `[id, code, name, nameZh]` 배열만 (~150KB, gzip ~35KB).
- `app/stages/page.tsx` (서버): 인덱스 읽어 섹션 렌더 + `StageSearch` 삽입.
- `app/stages/[stageId]/page.tsx`: fs 읽기로 전환, 이전/다음 링크.

## 결정 (2026-11-08, 추천대로 진행 후 사용자가 조정)

1. 기본 보기: 접기 목록 118줄은 못 찾겠다는 피드백으로 폐기. 탭(메인/이벤트/섬멸전) → 메인은 챕터 레일(00~14) 선택 후 카드 그리드, 이벤트는 최신순 목록에서 한 번에 하나 펼침(`<details name>`), 섬멸전은 바로 그리드. 카드는 코드 큰 글자 + 이름.
2. 한국 미출시(중국 선행) 스테이지: **목록·검색에서 숨김** (사용자 피드백 2026-11-08: 중국어 이름이 소음). 인덱스와 보드 페이지에는 남아 있음. 보기 토글은 필요해지면.
3. 하드 모드: 목록에 안 보임. 보드 페이지에서 진입하되, stageId의 `#`은 URL 경로에 못 쓰므로 별도 URL 규칙이 필요 → 하드 페이지는 2단계에서. 인덱스에는 `hard: true`로 포함.
4. 추가 제외: 훈련(`TR-`), 6성 변형(`#s`, 45개), 코드 없는 스테이지(11개).
5. 원본 다운로드: sparse clone 대신 필요한 파일만 raw URL로 받아 `.cache/gamedata/`에 보관(gitignore). git 의존 없음.

## 예상 작업량

sync 확장 2~3시간 (sparse clone, 이벤트 묶기 검증). UI 반나절. 합쳐서 하루.
