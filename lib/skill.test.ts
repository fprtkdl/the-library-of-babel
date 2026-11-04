import { describe, expect, it } from "vitest";
import { describeEnd, describeUse, toEnd, toUse } from "./skill";

const ops = { 芬: "char_123_fang" };

describe("toUse", () => {
  it("babel.use가 있으면 그대로", () => {
    expect(toUse({ babel: { use: { type: "enemy_in_skill_range" } } }, ops)).toEqual({ type: "enemy_in_skill_range" });
  });

  it("없으면 MAA kills > costs > 즉시 순", () => {
    expect(toUse({ kills: 5, costs: 10 }, ops)).toEqual({ type: "kills", n: 5 });
    expect(toUse({ costs: 10 }, ops)).toEqual({ type: "cost", n: 10 });
    expect(toUse({}, ops)).toEqual({ type: "now" });
  });

  it("목록에 없는 조건, 모르는 아군 이름은 에러", () => {
    expect(() => toUse({ babel: { use: { type: "attacks", n: 3 } } }, ops)).toThrow("잘못된 조건: attacks");
    expect(() => toUse({ babel: { use: { type: "operator_retreat", name: "없음" } } }, ops)).toThrow(
      "알 수 없는 오퍼레이터: 없음",
    );
  });
});

describe("toEnd", () => {
  it("없으면 undefined (자동 종료)", () => {
    expect(toEnd({}, ops)).toBeUndefined();
  });

  it("종료 전용 조건 허용, 사용 전용 조건은 에러", () => {
    expect(toEnd({ babel: { end: { type: "attacks", n: 3 } } }, ops)).toEqual({ type: "attacks", n: 3 });
    expect(() => toEnd({ babel: { end: { type: "now" } } }, ops)).toThrow("잘못된 조건: now");
  });
});

describe("describeUse / describeEnd", () => {
  it("사용 조건 문구", () => {
    expect(describeUse({ type: "now" })).toBe("즉시 사용");
    expect(describeUse({ type: "kills", n: 12 })).toBe("처치 수 12 달성 시");
    expect(describeUse({ type: "cost", n: 20 })).toBe("코스트 20 이상일 때");
    expect(describeUse({ type: "enemy_appear", enemy: "중갑병" })).toBe("중갑병 등장 시");
    expect(describeUse({ type: "operator_retreat", name: "芬" })).toBe("芬 퇴각 시");
    expect(describeUse({ type: "enemy_in_skill_range" })).toBe("적이 스킬 범위 내 진입 시");
    expect(describeUse({ type: "enemy_in_attack_range" })).toBe("적이 공격 사거리 내 진입 시");
    expect(describeUse({ type: "memo", text: "보스 2페이즈 직후" })).toBe("보스 2페이즈 직후");
  });

  it("종료 조건 문구, 없으면 자동 종료", () => {
    expect(describeEnd(undefined)).toBe("자동 종료");
    expect(describeEnd({ type: "kills", n: 8 })).toBe("처치 수 8 달성 후 종료");
    expect(describeEnd({ type: "enemy_appear", enemy: "보스" })).toBe("보스 등장 시 종료");
    expect(describeEnd({ type: "operator_retreat", name: "芬" })).toBe("芬 퇴각 시 종료");
    expect(describeEnd({ type: "attacks", n: 3 })).toBe("3회 공격 후 종료");
    expect(describeEnd({ type: "enemy_killed", enemy: "보스" })).toBe("보스 처치 후 종료");
    expect(describeEnd({ type: "memo", text: "체력 절반 이하에서 끔" })).toBe("체력 절반 이하에서 끔");
  });
});
