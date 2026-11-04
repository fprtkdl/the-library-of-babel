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
