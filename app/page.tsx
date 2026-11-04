import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export default function Home() {
  return (
    <main>
      <PageHeader label="THE LIBRARY OF BABEL" title="바벨의 도서관" sub="명일방주 스테이지 공략 보드 (비공식 팬 사이트)" />
      <section style={{ padding: 16 }}>
        <Link href="/stages/main_01-07" className="btn btn-primary">
          <strong>1-7 보드</strong>
          <small>BOARD</small>
        </Link>
      </section>
    </main>
  );
}
