// 전 스테이지 인덱스: 게임 데이터 테이블 → 목록·검색용 메타. 보드 타일은 data/stages/<board>.json 에 따로.

export type Zone = {
  id: string; // "main_4" | "act55side" | "campaign"
  kind: "main" | "event" | "campaign";
  title: string; // "에피소드 4" | 이벤트명 | "섬멸전"
  subtitle?: string; // "급성쇠약"
  startTime?: number; // 이벤트 시작(unix초). 최신순 정렬용
};

export type StageMeta = {
  id: string; // "main_04-10" (하드는 "main_04-10#f#")
  code: string; // "4-10"
  name: string; // 한국어, 없으면 중국어
  nameZh: string;
  zone: string; // Zone.id
  board: string; // 보드 파일 id. 하드는 일반 난이도 id
  hard?: true;
  kr: boolean; // 한국 서버 출시 여부
};

export type StageIndex = { zones: Zone[]; stages: StageMeta[] };

// 원본 테이블 중 쓰는 필드만
export type RawStage = {
  stageId: string;
  stageType: string;
  levelId: string | null;
  zoneId: string;
  code: string | null;
  name: string | null;
  isStoryOnly?: boolean;
};
export type RawZone = { zoneID: string; zoneIndex: number; type: string; zoneNameFirst: string | null; zoneNameSecond: string | null };
export type RawActivity = { id: string; name: string; startTime: number; type?: string };
export type RawTables = {
  stages: Record<string, RawStage>;
  zones: Record<string, RawZone>;
  activities: Record<string, RawActivity>; // activity_table.basicInfo
  zoneToActivity: Record<string, string>;
  ko: {
    stages: Record<string, { code: string | null; name: string | null }>;
    zones: Record<string, RawZone>;
    activities: Record<string, { name: string }>;
  };
};

const TYPES = new Set(["MAIN", "SUB", "ACTIVITY", "CAMPAIGN"]);
const MAIN_ZONES = new Set(["MAINLINE", "MAINLINE_ACTIVITY"]);
const HARD = "#f#";

// 포함: MAIN/SUB/ACTIVITY/CAMPAIGN, 레벨 파일 있음. 스토리 전용·훈련(TR-)·6성 변형(#s) 제외
export function isListed(s: RawStage): boolean {
  return TYPES.has(s.stageType) && !!s.levelId && !s.isStoryOnly && !!s.code && !s.code.startsWith("TR-") && !s.stageId.includes("#s");
}

export function buildStageIndex(raw: RawTables): StageIndex {
  const listed = Object.values(raw.stages).filter(isListed);
  const ids = new Set(listed.map((s) => s.stageId));
  const zones = new Map<string, Zone>();
  const stages: StageMeta[] = [];

  for (const s of listed) {
    const hard = s.stageId.endsWith(HARD);
    const board = hard ? s.stageId.slice(0, -HARD.length) : s.stageId;
    if (hard && !ids.has(board)) continue; // 일반 난이도가 목록에 없으면 하드도 제외
    if (raw.activities[raw.zoneToActivity[s.zoneId]]?.type === "APRIL_FOOL") continue; // 만우절 미니게임, 공략 대상 아님

    const zone = zoneFor(s, raw);
    if (!zones.has(zone.id)) zones.set(zone.id, zone);
    const ko = raw.ko.stages[s.stageId];
    stages.push({
      id: s.stageId,
      code: ko?.code ?? s.code!,
      name: ko?.name ?? s.name ?? s.code!,
      nameZh: s.name ?? s.code!,
      zone: zone.id,
      board,
      ...(hard ? { hard: true as const } : {}),
      kr: !!ko,
    });
  }

  const order = { main: 0, event: 1, campaign: 2 };
  // 메인: stage_table 등장 순(=게임 순). zone_table의 zoneIndex는 챕터 순서가 아니다. 선행 공개 챕터(MAINLINE_ACTIVITY)는 뒤로
  const list = [...zones.values()];
  // 선행 챕터끼리는 stage_table에 최신이 먼저 오므로 챕터 번호로 정렬
  const mainRank = (z: Zone) =>
    raw.zones[z.id]?.type === "MAINLINE_ACTIVITY" ? 1000 + Number(z.title.match(/\d+/)?.[0] ?? list.indexOf(z)) : list.indexOf(z);
  const sorted = list.sort((a, b) => {
    if (a.kind !== b.kind) return order[a.kind] - order[b.kind];
    if (a.kind === "event") return (b.startTime ?? 0) - (a.startTime ?? 0); // 최신 먼저
    return mainRank(a) - mainRank(b);
  });
  return { zones: sorted, stages };
}

function zoneFor(s: RawStage, raw: RawTables): Zone {
  if (s.stageType === "CAMPAIGN") return { id: "campaign", kind: "campaign", title: "섬멸전" };
  const z = raw.zones[s.zoneId];
  const kz = raw.ko.zones[s.zoneId];
  if (z && MAIN_ZONES.has(z.type)) {
    // 선행 공개 챕터는 zoneNameFirst가 영문 부제라서 코드("15-1")에서 "에피소드 15"를 만든다
    const chapter = z.type === "MAINLINE_ACTIVITY" ? s.code?.match(/^(\d+)-/)?.[1] : undefined;
    const first = chapter ? `에피소드 ${chapter}` : (kz?.zoneNameFirst ?? z.zoneNameFirst);
    const second = kz?.zoneNameSecond ?? z.zoneNameSecond;
    return { id: z.zoneID, kind: "main", title: first ?? second ?? z.zoneID, ...(first && second ? { subtitle: second } : {}) };
  }
  const actId = raw.zoneToActivity[s.zoneId];
  const act = actId ? raw.activities[actId] : undefined;
  if (act) {
    return { id: act.id, kind: "event", title: eventTitle(act, kz ?? z, raw), startTime: act.startTime };
  }
  // 이벤트 테이블에 없는 존: 존 이름으로
  return { id: s.zoneId, kind: "event", title: kz?.zoneNameSecond ?? z?.zoneNameSecond ?? kz?.zoneNameFirst ?? z?.zoneNameFirst ?? s.zoneId };
}

const RERUN = /[·・]?复刻$/;

// 이벤트 한국어 이름. 복각("X·复刻")은 ko 테이블에 별도 항목이 없어서 원본 이벤트 이름 + "복각". 그래도 없으면 존 이름, 마지막은 중국어.
function eventTitle(act: RawActivity, zone: RawZone | undefined, raw: RawTables): string {
  const ko = raw.ko.activities[act.id]?.name;
  if (ko) return ko;
  if (RERUN.test(act.name)) {
    const base = act.name.replace(RERUN, "");
    const orig = Object.values(raw.activities).find((a) => a.name === base);
    const koBase = orig && raw.ko.activities[orig.id]?.name;
    if (koBase) return `${koBase} 복각`;
  }
  return zone?.zoneNameSecond ?? zone?.zoneNameFirst ?? act.name;
}

// 검색 ---------------------------------------------------------------

export type SearchRow = [id: string, code: string, name: string, nameZh: string, kr?: boolean];

// 코드 비교용: 소문자, 글자·숫자만 남김 ("H6-4" → "h64")
export function normalizeCode(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

// 코드 정확 일치 → 코드 앞부분 일치 → 코드 포함 → 이름 포함 순. 빈 검색어는 0건.
export function searchStages(rows: readonly SearchRow[], query: string, limit = 50): SearchRow[] {
  const q = normalizeCode(query);
  if (!q) return [];
  const text = query.trim().toLowerCase();
  const scored: [number, SearchRow][] = [];
  for (const row of rows) {
    const code = normalizeCode(row[1]);
    let score = -1;
    if (code === q) score = 0;
    else if (code.startsWith(q)) score = 1;
    else if (code.includes(q)) score = 2;
    else if (row[2].toLowerCase().includes(text) || row[3].toLowerCase().includes(text)) score = 3;
    if (score >= 0) scored.push([score, row]);
  }
  return scored
    .sort((a, b) => a[0] - b[0])
    .slice(0, limit)
    .map(([, row]) => row);
}
