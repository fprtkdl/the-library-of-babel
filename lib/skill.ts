// 스킬 사용·종료 조건: docs/superpowers/specs/2026-11-04-skill-timing-design.md
export type UseCondition =
  | { type: "now" }
  | { type: "kills"; n: number }
  | { type: "cost"; n: number }
  | { type: "enemy_appear"; enemy: string }
  | { type: "operator_retreat"; name: string }
  | { type: "enemy_in_skill_range" }
  | { type: "enemy_in_attack_range" }
  | { type: "memo"; text: string };

export type EndCondition =
  | { type: "kills"; n: number }
  | { type: "enemy_appear"; enemy: string }
  | { type: "operator_retreat"; name: string }
  | { type: "attacks"; n: number }
  | { type: "enemy_killed"; enemy: string }
  | { type: "memo"; text: string };

type RawCondition = { type: string; n?: number; enemy?: string; name?: string; text?: string };
export type SkillAction = { kills?: number; costs?: number; babel?: { use?: RawCondition; end?: RawCondition } };

const USE_TYPES = ["now", "kills", "cost", "enemy_appear", "operator_retreat", "enemy_in_skill_range", "enemy_in_attack_range", "memo"];
const END_TYPES = ["kills", "enemy_appear", "operator_retreat", "attacks", "enemy_killed", "memo"];

function check(raw: RawCondition, allowed: string[], operators: Record<string, string>) {
  if (!allowed.includes(raw.type)) throw new Error(`잘못된 조건: ${raw.type}`);
  if (raw.type === "operator_retreat" && !Object.hasOwn(operators, raw.name ?? "")) {
    throw new Error(`알 수 없는 오퍼레이터: ${raw.name}`);
  }
}

export function toUse(a: SkillAction, operators: Record<string, string>): UseCondition {
  const raw = a.babel?.use;
  if (raw) {
    check(raw, USE_TYPES, operators);
    return raw as UseCondition;
  }
  if (a.kills !== undefined) return { type: "kills", n: a.kills };
  if (a.costs !== undefined) return { type: "cost", n: a.costs };
  return { type: "now" };
}

export function toEnd(a: SkillAction, operators: Record<string, string>): EndCondition | undefined {
  const raw = a.babel?.end;
  if (!raw) return undefined;
  check(raw, END_TYPES, operators);
  return raw as EndCondition;
}

export function describeUse(c: UseCondition): string {
  switch (c.type) {
    case "now": return "즉시 사용";
    case "kills": return `처치 수 ${c.n} 달성 시`;
    case "cost": return `코스트 ${c.n} 이상일 때`;
    case "enemy_appear": return `${c.enemy} 등장 시`;
    case "operator_retreat": return `${c.name} 퇴각 시`;
    case "enemy_in_skill_range": return "적이 스킬 범위 내 진입 시";
    case "enemy_in_attack_range": return "적이 공격 사거리 내 진입 시";
    case "memo": return c.text;
  }
}

export function describeEnd(c: EndCondition | undefined): string {
  if (!c) return "자동 종료";
  switch (c.type) {
    case "kills": return `처치 수 ${c.n} 달성 후 종료`;
    case "enemy_appear": return `${c.enemy} 등장 시 종료`;
    case "operator_retreat": return `${c.name} 퇴각 시 종료`;
    case "attacks": return `${c.n}회 공격 후 종료`;
    case "enemy_killed": return `${c.enemy} 처치 후 종료`;
    case "memo": return c.text;
  }
}
