import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { BoardPlayer } from "@/components/BoardPlayer";
import { StageBoard } from "@/components/StageBoard";
import type { StageBoard as Board } from "@/lib/board";
import type { StageIndex } from "@/lib/stage-index";
import { toSteps, type Copilot } from "@/lib/strategy";
import index from "@/data/stages/index.json";
import operators from "@/data/operators.json";
import sample from "@/data/strategies/main_01-07.sample.json";

const { zones, stages } = index as StageIndex;
// 하드 모드(#f#)는 URL에 # 을 못 써서 아직 페이지 없음. 보드는 일반과 같다
const visible = stages.filter((s) => !s.hard);
const KIND_LABEL = { main: "MAIN STORY", event: "EVENT", campaign: "ANNIHILATION" } as const;
const NO_AVATARS: ReadonlySet<string> = new Set();

export const dynamicParams = false;

export function generateStaticParams() {
  return visible.map((s) => ({ stageId: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ stageId: string }> }) {
  const { stageId } = await params;
  const meta = visible.find((s) => s.id === stageId);
  return meta ? { title: `${meta.code} ${meta.name} 공략 · 바벨의 도서관` } : {};
}

export default async function StagePage({ params }: { params: Promise<{ stageId: string }> }) {
  const { stageId } = await params;
  const i = visible.findIndex((s) => s.id === stageId);
  if (i < 0) notFound();
  const meta = visible[i];
  const zone = zones.find((z) => z.id === meta.zone)!;
  // 같은 구역 안에서 이전/다음. 인덱스 전체 순서는 메인 챕터 → 서브 순이라 인접 항목이 다른 구역일 수 있다
  const inZone = visible.filter((s) => s.zone === meta.zone);
  const j = inZone.indexOf(meta);
  const prev = inZone[j - 1];
  const next = inZone[j + 1];
  const board = JSON.parse(await readFile(path.join(process.cwd(), "data/stages", `${meta.board}.json`), "utf8")) as Board;

  // shortcut: 공략은 아직 1-7 샘플 하나. 공략 DB가 생기면 여기서 조회
  const copilot = stageId === "main_01-07" ? (sample as Copilot & { doc: { title: string } }) : undefined;
  const steps = copilot ? toSteps(copilot, board, operators) : [];
  const squad = copilot ? copilot.opers.map((o) => ({ name: o.name, charId: (operators as Record<string, string>)[o.name] })) : [];
  // shortcut: public/ 파일 검사는 빌드 시 prerender에서만 동작, 페이지가 동적 렌더링되면 sync 스크립트가 쓰는 매니페스트로 교체
  const avatars = squad.map((m) => m.charId).filter((id) => existsSync(path.join(process.cwd(), "public/assets/avatar", `${id}.png`)));

  const sub = copilot
    ? `${copilot.doc.title} · 편성 ${squad.length} · 단계 ${steps.length}`
    : `${board.width}×${board.height}${meta.kr ? "" : " · KR 미출시"} · 아직 공략 없음`;

  return (
    <main>
      <PageHeader label={`${KIND_LABEL[zone.kind]} / ${zone.title}${zone.subtitle ? ` · ${zone.subtitle}` : ""}`} title={`${meta.code} · ${meta.name}`} sub={sub} />
      <section style={{ padding: 16 }}>
        {copilot ? (
          <BoardPlayer board={board} steps={steps} squad={squad} avatars={avatars} />
        ) : (
          <StageBoard board={board} placements={[]} avatars={NO_AVATARS} />
        )}
      </section>
      <nav aria-label="같은 구역 스테이지" style={{ display: "flex", gap: 8, padding: "0 16px 16px" }}>
        {prev && (
          <Link href={`/stages/${prev.id}`} className="btn btn-ghost">
            <strong>◀ {prev.code}</strong>
            <small>PREV</small>
          </Link>
        )}
        <Link href="/stages" className="btn btn-ghost">
          <strong>목록</strong>
          <small>LIST</small>
        </Link>
        {next && (
          <Link href={`/stages/${next.id}`} className="btn btn-ghost">
            <strong>{next.code} ▶</strong>
            <small>NEXT</small>
          </Link>
        )}
      </nav>
      <footer className="label-en" style={{ padding: "0 16px 16px", color: "var(--line-2)", letterSpacing: 0 }}>
        비공식 팬 사이트. 데이터 출처: 명일방주 인게임 정보.
      </footer>
    </main>
  );
}
