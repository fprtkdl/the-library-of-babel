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
