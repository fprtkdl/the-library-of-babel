export type CharacterTable = Record<string, { name: string }>;

export function findCharIds(table: CharacterTable, names: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of names) {
    // shortcut: 같은 이름 여러 형태(예: 阿米娅)면 첫 항목, 공략 형식에 형태 구분이 생기면 교체
    const id = Object.keys(table).find((k) => k.startsWith("char_") && table[k].name === name);
    if (!id) throw new Error(`character_table에 없음: ${name}`);
    out[name] = id;
  }
  return out;
}
