import { existsSync } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { BoardPlayer } from "@/components/BoardPlayer";
import type { StageBoard as Board } from "@/lib/board";
import { toSteps, type Copilot } from "@/lib/strategy";
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

  const steps = toSteps(sample as Copilot, board as Board, operators);
  const squad = sample.opers.map((o) => ({ name: o.name, charId: (operators as Record<string, string>)[o.name] }));
  // shortcut: public/ 파일 검사는 빌드 시 prerender에서만 동작, 페이지가 동적 렌더링되면 sync 스크립트가 쓰는 매니페스트로 교체
  const avatars = squad
    .map((m) => m.charId)
    .filter((id) => existsSync(path.join(process.cwd(), "public/assets/avatar", `${id}.png`)));

  return (
    <main>
      <PageHeader label="STAGE DATA / 01-07" title={`1-7 · ${sample.doc.title}`} sub={`편성 ${squad.length} · 단계 ${steps.length}`} />
      <section style={{ padding: 16 }}>
        <BoardPlayer board={board as Board} steps={steps} squad={squad} avatars={avatars} />
      </section>
      <footer className="label-en" style={{ padding: "0 16px 16px", color: "var(--line-2)", letterSpacing: 0 }}>
        비공식 팬 사이트. 데이터 출처: 명일방주 인게임 정보.
      </footer>
    </main>
  );
}
