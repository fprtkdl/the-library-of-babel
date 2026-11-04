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
