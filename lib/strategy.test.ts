import { describe, expect, it } from "vitest";
import type { StageBoard, Tile } from "./board";
import { describeStep, frameAt, toPlacements, toSteps, type Copilot } from "./strategy";

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

  it("상속 키(constructor 등)는 오퍼레이터로 취급하지 않는다", () => {
    expect(() =>
      toPlacements(copilot([{ name: "constructor", location: [1, 0], direction: "Down" }]), board, ops),
    ).toThrow("알 수 없는 오퍼레이터: constructor");
  });

  it('type "部署"도 Deploy로 취급한다', () => {
    const p = toPlacements(copilot([{ type: "部署", name: "芬", location: [1, 0], direction: "Down" }]), board, ops);
    expect(p).toHaveLength(1);
  });
});

const squad = [
  { name: "克洛丝", charId: "char_124_kroos" },
  { name: "芬", charId: "char_123_fang" },
];
const seq = copilot([
  { name: "克洛丝", location: [0, 0], direction: "Down" },
  { name: "芬", location: [1, 1], direction: "Right" },
  { type: "Retreat", name: "芬" },
  { type: "SkillUsage", name: "克洛丝" },
  { name: "芬", location: [2, 1], direction: "Left" },
  { type: "Retreat", location: [0, 0] },
]);

describe("toSteps", () => {
  it("배치와 철수만 단계로, 재배치는 새 순번", () => {
    const steps = toSteps(seq, board, ops);
    expect(steps.map((s) => `${s.kind}:${s.placement.name}:${s.placement.order}`)).toEqual([
      "deploy:克洛丝:1",
      "deploy:芬:2",
      "retreat:芬:2",
      "deploy:芬:3",
      "retreat:克洛丝:1",
    ]);
    expect(steps[3].placement).toMatchObject({ x: 2, y: 1, direction: "Left" });
  });

  it("toPlacements는 배치 단계만", () => {
    expect(toPlacements(seq, board, ops).map((p) => p.order)).toEqual([1, 2, 3]);
  });

  it("필드에 없는 대상 철수는 에러", () => {
    expect(() => toSteps(copilot([{ type: "Retreat", name: "芬" }]), board, ops)).toThrow("철수 대상 없음: 芬");
    expect(() => toSteps(copilot([{ type: "Retreat", location: [1, 1] }]), board, ops)).toThrow("철수 대상 없음: [1, 1]");
  });

  it("이미 필드에 있는 오퍼레이터 재배치는 에러", () => {
    const twice = copilot([
      { name: "芬", location: [1, 1], direction: "Up" },
      { name: "芬", location: [2, 1], direction: "Up" },
    ]);
    expect(() => toSteps(twice, board, ops)).toThrow("이미 배치됨: 芬");
  });

  it("점유된 칸 배치는 에러", () => {
    const clash = copilot([
      { name: "芬", location: [1, 1], direction: "Up" },
      { name: "克洛丝", location: [1, 1], direction: "Up" },
    ]);
    expect(() => toSteps(clash, board, ops)).toThrow("칸 점유: 克洛丝 [1, 1]");
  });
});

describe("frameAt", () => {
  const steps = toSteps(seq, board, ops);

  it("0단계: 필드 비어 있고 전원 대기", () => {
    const f = frameAt(steps, squad, 0);
    expect(f.field).toEqual([]);
    expect(f.waiting.map((w) => `${w.name}:${w.state}`)).toEqual(["克洛丝:대기", "芬:대기"]);
    expect(f.current).toBeUndefined();
  });

  it("철수 직후: 필드에서 빠지고 재배치 대기", () => {
    const f = frameAt(steps, squad, 3);
    expect(f.field.map((p) => p.name)).toEqual(["克洛丝"]);
    expect(f.waiting.map((w) => `${w.name}:${w.state}`)).toEqual(["芬:재배치 대기"]);
    expect(f.current?.kind).toBe("retreat");
  });

  it("재배치 후: 새 위치로 필드 복귀", () => {
    const f = frameAt(steps, squad, 4);
    expect(f.field.find((p) => p.name === "芬")).toMatchObject({ x: 2, y: 1, order: 3 });
    expect(f.waiting).toEqual([]);
  });
});

describe("스킬 단계", () => {
  const withSkill = copilot([
    { name: "芬", location: [1, 1], direction: "Right" },
    { type: "Skill", name: "芬", kills: 5 },
    { type: "Skill", name: "芬", babel: { use: { type: "now" }, end: { type: "attacks", n: 3 } } },
    { type: "SkillUsage", name: "芬" },
  ]);

  it("Skill 액션을 단계로 만들고 조건을 붙인다, 필드는 그대로", () => {
    const steps = toSteps(withSkill, board, ops);
    expect(steps.map((s) => s.kind)).toEqual(["deploy", "skill", "skill"]);
    expect(steps[1]).toMatchObject({ kind: "skill", use: { type: "kills", n: 5 } });
    expect(steps[2]).toMatchObject({ use: { type: "now" }, end: { type: "attacks", n: 3 } });
    expect(frameAt(steps, [], 3).field.map((p) => p.name)).toEqual(["芬"]);
  });

  it("필드에 없는 오퍼레이터 스킬은 에러", () => {
    expect(() => toSteps(copilot([{ type: "Skill", name: "芬" }]), board, ops)).toThrow("스킬 대상 없음: 芬");
  });

  it("단계 설명 문구", () => {
    const steps = toSteps(
      copilot([...withSkill.actions.slice(0, 3), { type: "Retreat", name: "芬" }]),
      board,
      ops,
    );
    expect(steps.map((s, i) => describeStep(s, i + 1))).toEqual([
      "1단계 · 芬 배치 [1, 1] →",
      "2단계 · 芬 스킬 — 처치 수 5 달성 시 · 자동 종료",
      "3단계 · 芬 스킬 — 즉시 사용 · 3회 공격 후 종료",
      "4단계 · 芬 철수",
    ]);
  });
});
