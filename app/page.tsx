import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export default function Home() {
  return (
    <main>
      <PageHeader label="THE LIBRARY OF BABEL" title="바벨의 도서관" sub="명일방주 스테이지 공략 보드 (비공식 팬 사이트)" />
      <section style={{ padding: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link href="/stages" className="btn btn-primary">
          <strong>스테이지 찾기</strong>
          <small>STAGES</small>
        </Link>
        <Link href="/stages/main_01-07" className="btn btn-ghost">
          <strong>1-7 샘플 공략</strong>
          <small>SAMPLE</small>
        </Link>
      </section>
    </main>
  );
}
