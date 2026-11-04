import { existsSync } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { StageBoard } from "@/components/StageBoard";
import type { StageBoard as Board } from "@/lib/board";
import { toPlacements, type Copilot } from "@/lib/strategy";
import board from "@/data/stages/main_01-07.json";
import operators from "@/data/operators.json";
import sample from "@/data/strategies/main_01-07.sample.json";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ stageId: "main_01-07" }];
}

export default async function StagePage({ params }: { params: Promise<{ stageId: string }> }) {
  const { stageId } = await params;
  if (stageId !== "main_01-07") notFound();

  const placements = toPlacements(sample as Copilot, board as Board, operators);
  // shortcut: public/ 파일 검사는 빌드 시 prerender에서만 동작, 페이지가 동적 렌더링되면 sync 스크립트가 쓰는 매니페스트로 교체
  const avatars = new Set(
    placements
      .map((p) => p.charId)
      .filter((id) => existsSync(path.join(process.cwd(), "public/assets/avatar", `${id}.png`))),
  );

  return (
    <main style={{ padding: 16 }}>
      <h1>1-7</h1>
      <p>{sample.doc.title}</p>
      <StageBoard board={board as Board} placements={placements} avatars={avatars} />
      <footer style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
        비공식 팬 사이트. 데이터 출처: 명일방주 인게임 정보.
      </footer>
    </main>
  );
}
