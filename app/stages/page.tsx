import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StageBrowser, StageBrowserWithQuery, type BrowserStage } from "@/components/StageBrowser";
import type { StageIndex } from "@/lib/stage-index";
import index from "@/data/stages/index.json";

const { zones, stages } = index as StageIndex;
// 한국 서버 출시분만, 하드 모드 제외. 중국 선행 스테이지는 인덱스에만 있음 (보기 토글은 필요해지면)
const visible: BrowserStage[] = stages.filter((s) => !s.hard && s.kr).map(({ id, code, name, zone }) => ({ id, code, name, zone }));
const used = new Set(visible.map((s) => s.zone));
const shown = zones.filter((z) => used.has(z.id));

export default function StagesPage() {
  return (
    <main>
      <PageHeader label="STAGE LIST" title="스테이지" sub={`${visible.length}개 · 한국 서버 기준`} />
      {/* 정적 HTML에는 폴백(검색어 없는 같은 UI)이 들어가고, 클라이언트에서 ?q= 를 읽은 버전으로 바뀐다 */}
      <Suspense fallback={<StageBrowser zones={shown} stages={visible} />}>
        <StageBrowserWithQuery zones={shown} stages={visible} />
      </Suspense>
    </main>
  );
}
