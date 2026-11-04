import { describe, expect, it } from "vitest";
import { findCharIds } from "./operators";

const table = {
  token_10000_silent_healrb: { name: "芬" }, // char_ 아닌 항목은 무시
  char_123_fang: { name: "芬" },
  char_124_kroos: { name: "克洛丝" },
};

describe("findCharIds", () => {
  it("이름을 char_ 로 시작하는 ID에 매핑한다", () => {
    expect(findCharIds(table, ["芬", "克洛丝"])).toEqual({ 芬: "char_123_fang", 克洛丝: "char_124_kroos" });
  });

  it("없는 이름이면 에러", () => {
    expect(() => findCharIds(table, ["없음"])).toThrow("character_table에 없음: 없음");
  });
});
