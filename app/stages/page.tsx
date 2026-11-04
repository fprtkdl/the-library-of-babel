import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

// shortcut: 스테이지가 1-7 하나뿐이라 목록을 하드코딩, 스테이지가 늘면 data/stages/ 파일 목록에서 생성
const STAGES = [{ id: "main_01-07", code: "1-7" }];

export default function StagesPage() {
  return (
    <main>
      <PageHeader label="STAGE LIST" title="스테이지" sub={`${STAGES.length}개`} />
      <section style={{ padding: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {STAGES.map((s) => (
          <Link key={s.id} href={`/stages/${s.id}`} className="btn btn-paper">
            <strong>{s.code}</strong>
            <small>{s.id.toUpperCase()}</small>
          </Link>
        ))}
      </section>
    </main>
  );
}
