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
