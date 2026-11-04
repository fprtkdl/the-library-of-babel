import { mkdir, writeFile } from "node:fs/promises";

const RESOURCE = "https://raw.githubusercontent.com/yuanyan3060/ArknightsGameResource/main";

// 실패는 경고만: 페이지가 이름 텍스트로 대체한다
export async function downloadAvatars(ids: string[]) {
  await mkdir("public/assets/avatar", { recursive: true });
  let ok = 0;
  await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await fetch(`${RESOURCE}/avatar/${id}.png`);
        if (!res.ok) throw new Error(String(res.status));
        await writeFile(`public/assets/avatar/${id}.png`, Buffer.from(await res.arrayBuffer()));
        ok++;
      } catch (e) {
        console.warn(`avatar ${id} failed: ${e}`);
      }
    }),
  );
  console.log(`avatars: ${ok}/${ids.length}`);
}
