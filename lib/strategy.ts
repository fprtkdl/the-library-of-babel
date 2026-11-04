import type { StageBoard } from "./board";

export type Direction = "Left" | "Right" | "Up" | "Down";
export type Placement = { order: number; charId: string; name: string; x: number; y: number; direction: Direction };
export type Copilot = {
  stage_name: string;
  opers: { name: string; skill?: number }[];
  actions: { type?: string; name?: string; location?: [number, number]; direction?: string }[];
};

const DIRECTIONS: string[] = ["Left", "Right", "Up", "Down"];

export function toPlacements(copilot: Copilot, board: StageBoard, operators: Record<string, string>): Placement[] {
  return copilot.actions
    .filter((a) => ["Deploy", "部署"].includes(a.type ?? "Deploy")) // MAA는 type 생략 시 Deploy
    .map((a, i) => {
      const name = a.name ?? "";
      const charId = operators[name];
      if (!charId) throw new Error(`알 수 없는 오퍼레이터: ${name}`);
      const [x, y] = a.location ?? [-1, -1];
      const tile = board.tiles[y]?.[x];
      if (!tile) throw new Error(`격자 밖 좌표: ${name} [${x}, ${y}]`);
      if (tile.buildable === "NONE") throw new Error(`배치 불가 타일: ${name} [${x}, ${y}]`);
      if (!DIRECTIONS.includes(a.direction ?? "")) throw new Error(`잘못된 방향: ${name}`);
      return { order: i + 1, charId, name, x, y, direction: a.direction as Direction };
    });
}
