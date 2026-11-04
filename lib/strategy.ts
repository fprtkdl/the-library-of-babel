import type { StageBoard } from "./board";

export type Direction = "Left" | "Right" | "Up" | "Down";
export type Placement = { order: number; charId: string; name: string; x: number; y: number; direction: Direction };
export type Copilot = {
  stage_name: string;
  opers: { name: string; skill?: number }[];
  actions: { type?: string; name?: string; location?: [number, number]; direction?: string }[];
};
export type Step = { kind: "deploy" | "retreat"; placement: Placement };
export type Member = { name: string; charId: string };
export type Waiting = Member & { state: "대기" | "재배치 대기" };
export type Frame = { field: Placement[]; waiting: Waiting[]; current?: Step };

const DIRECTIONS: string[] = ["Left", "Right", "Up", "Down"];
const DEPLOY = ["Deploy", "部署"]; // MAA는 type 생략 시 Deploy
const RETREAT = ["Retreat", "撤退"];

// 배치·철수를 필드 상태와 함께 재생하며 검증한다. 그 외 액션(스킬, 배속 등)은 무시.
export function toSteps(copilot: Copilot, board: StageBoard, operators: Record<string, string>): Step[] {
  const field = new Map<string, Placement>(); // 이름 → 현재 배치
  const steps: Step[] = [];
  let order = 0;

  for (const a of copilot.actions) {
    const type = a.type ?? "Deploy";
    if (DEPLOY.includes(type)) {
      const name = a.name ?? "";
      const charId = Object.hasOwn(operators, name) ? operators[name] : undefined;
      if (!charId) throw new Error(`알 수 없는 오퍼레이터: ${name}`);
      const [x, y] = a.location ?? [-1, -1];
      const tile = board.tiles[y]?.[x];
      if (!tile) throw new Error(`격자 밖 좌표: ${name} [${x}, ${y}]`);
      if (tile.buildable === "NONE") throw new Error(`배치 불가 타일: ${name} [${x}, ${y}]`);
      if (!DIRECTIONS.includes(a.direction ?? "")) throw new Error(`잘못된 방향: ${name}`);
      if (field.has(name)) throw new Error(`이미 배치됨: ${name}`);
      if ([...field.values()].some((p) => p.x === x && p.y === y)) throw new Error(`칸 점유: ${name} [${x}, ${y}]`);
      const placement = { order: ++order, charId, name, x, y, direction: a.direction as Direction };
      field.set(name, placement);
      steps.push({ kind: "deploy", placement });
    } else if (RETREAT.includes(type)) {
      const target = a.name
        ? field.get(a.name)
        : [...field.values()].find((p) => p.x === a.location?.[0] && p.y === a.location?.[1]);
      if (!target) throw new Error(`철수 대상 없음: ${a.name ?? `[${a.location?.join(", ")}]`}`);
      field.delete(target.name);
      steps.push({ kind: "retreat", placement: target });
    }
  }
  return steps;
}

export function toPlacements(copilot: Copilot, board: StageBoard, operators: Record<string, string>): Placement[] {
  return toSteps(copilot, board, operators)
    .filter((s) => s.kind === "deploy")
    .map((s) => s.placement);
}

// k단계까지 재생한 필드와 대기열 (0 = 빈 맵, 전원 대기)
export function frameAt(steps: Step[], squad: Member[], k: number): Frame {
  const field = new Map<string, Placement>();
  const retreated = new Set<string>();
  for (const s of steps.slice(0, k)) {
    if (s.kind === "deploy") field.set(s.placement.name, s.placement);
    else {
      field.delete(s.placement.name);
      retreated.add(s.placement.name);
    }
  }
  const waiting = squad
    .filter((m) => !field.has(m.name))
    .map((m): Waiting => ({ ...m, state: retreated.has(m.name) ? "재배치 대기" : "대기" }));
  return { field: [...field.values()], waiting, current: k > 0 ? steps[k - 1] : undefined };
}
