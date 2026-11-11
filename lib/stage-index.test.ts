import { describe, expect, it } from "vitest";
import { buildStageIndex, normalizeCode, searchStages, type RawStage, type RawTables, type SearchRow } from "./stage-index";

const stage = (stageId: string, over: Partial<RawStage> = {}): RawStage => ({
  stageId,
  stageType: "MAIN",
  levelId: `Obt/Main/level_${stageId.replace("#f#", "")}`,
  zoneId: "main_4",
  code: "4-1",
  name: "名",
  ...over,
});

const raw: RawTables = {
  stages: {
    "main_04-01": stage("main_04-01"),
    "main_04-01#f#": stage("main_04-01#f#"),
    "main_04-02": stage("main_04-02", { code: "4-2" }),
    tr_5: stage("tr_5", { code: "TR-5" }),
    "main_04-01#s": stage("main_04-01#s"),
    story: stage("story", { code: "4-3", isStoryOnly: true }),
    act9_01: stage("act9_01", { stageType: "ACTIVITY", zoneId: "act9_zone1", code: "WR-1", name: "旧", levelId: "Activities/act9/level_act9_01" }),
    act9_ex1: stage("act9_ex1", { stageType: "ACTIVITY", zoneId: "act9_zone2", code: "WR-EX-1", levelId: "Activities/act9/level_act9_ex1" }),
    act55_01: stage("act55_01", { stageType: "ACTIVITY", zoneId: "act55_zone1", code: "TL-1", levelId: "Activities/act55/level_act55_01" }),
    act9re_01: stage("act9re_01", { stageType: "ACTIVITY", zoneId: "act9re_zone1", code: "WR-1", levelId: "Activities/act9re/level_act9re_01" }),
    camp_01: stage("camp_01", { stageType: "CAMPAIGN", zoneId: "camp", code: "乌萨斯", name: "切尔诺伯格", levelId: "Obt/Campaign/level_camp_01" }),
    daily: stage("daily", { stageType: "DAILY", code: "CE-5" }),
  },
  zones: {
    main_4: { zoneID: "main_4", zoneIndex: 4, type: "MAINLINE", zoneNameFirst: "第四章", zoneNameSecond: "急性衰竭" },
  },
  activities: {
    act9: { id: "act9", name: "旧活动", startTime: 100 },
    act55: { id: "act55", name: "新活动", startTime: 200 },
    act9re: { id: "act9re", name: "旧活动·复刻", startTime: 150 },
  },
  zoneToActivity: { act9_zone1: "act9", act9_zone2: "act9", act55_zone1: "act55", act9re_zone1: "act9re" },
  ko: {
    stages: {
      "main_04-01": { code: "4-1", name: "이름" },
      "main_04-01#f#": { code: "4-1", name: "이름" },
      camp_01: { code: "우르수스", name: "체르노보그" },
    },
    zones: { main_4: { zoneID: "main_4", zoneIndex: 4, type: "MAINLINE", zoneNameFirst: "에피소드 4", zoneNameSecond: "급성쇠약" } },
    activities: { act9: { name: "옛 이벤트" } },
  },
};

describe("buildStageIndex", () => {
  const index = buildStageIndex(raw);
  const ids = index.stages.map((s) => s.id);

  it("스토리 전용·훈련·6성 변형·자원수급은 뺀다", () => {
    expect(ids).not.toContain("story");
    expect(ids).not.toContain("tr_5");
    expect(ids).not.toContain("main_04-01#s");
    expect(ids).not.toContain("daily");
  });

  it("하드는 일반 보드를 가리키고 hard 표시", () => {
    const hard = index.stages.find((s) => s.id === "main_04-01#f#")!;
    expect(hard.board).toBe("main_04-01");
    expect(hard.hard).toBe(true);
    expect(index.stages.find((s) => s.id === "main_04-01")!.hard).toBeUndefined();
  });

  it("한국어 이름 우선, 없으면 중국어 + kr:false", () => {
    expect(index.stages.find((s) => s.id === "main_04-01")).toMatchObject({ name: "이름", nameZh: "名", kr: true });
    expect(index.stages.find((s) => s.id === "main_04-02")).toMatchObject({ name: "名", kr: false });
    expect(index.stages.find((s) => s.id === "camp_01")).toMatchObject({ code: "우르수스", name: "체르노보그" });
  });

  it("존 순서: 메인 → 이벤트 최신순 → 섬멸전. 이벤트 존 여러 개는 하나로 합침", () => {
    expect(index.zones.map((z) => z.id)).toEqual(["main_4", "act55", "act9re", "act9", "campaign"]);
    expect(index.zones[0]).toMatchObject({ kind: "main", title: "에피소드 4", subtitle: "급성쇠약" });
    expect(index.zones[1]).toMatchObject({ kind: "event", title: "新活动" });
    expect(index.zones[3]).toMatchObject({ kind: "event", title: "옛 이벤트" });
    expect(index.stages.filter((s) => s.zone === "act9").map((s) => s.id)).toEqual(["act9_01", "act9_ex1"]);
  });

  it("복각 이벤트는 원본 이벤트의 한국어 이름 + 복각", () => {
    expect(index.zones[2]).toMatchObject({ id: "act9re", title: "옛 이벤트 복각" });
  });
});

describe("searchStages", () => {
  const rows: SearchRow[] = [
    ["main_01-07", "1-7", "폭군", "暴君"],
    ["main_06-04", "H6-4", "하드", "困难"],
    ["main_11-07", "11-7", "다른", "别"],
    ["act_ex8", "TL-EX-8", "끝", "终"],
  ];

  it("코드 정규화: 하이픈·대소문자 무시", () => {
    expect(normalizeCode("H6-4")).toBe("h64");
    expect(searchStages(rows, "h64").map((r) => r[0])).toEqual(["main_06-04"]);
  });

  it("정확 일치가 포함 일치보다 먼저", () => {
    expect(searchStages(rows, "1-7").map((r) => r[0])).toEqual(["main_01-07", "main_11-07"]);
  });

  it("한국어·중국어 이름으로도 찾고, 빈 검색어는 0건", () => {
    expect(searchStages(rows, "폭군").map((r) => r[0])).toEqual(["main_01-07"]);
    expect(searchStages(rows, "暴君").map((r) => r[0])).toEqual(["main_01-07"]);
    expect(searchStages(rows, "  ")).toEqual([]);
  });
});
