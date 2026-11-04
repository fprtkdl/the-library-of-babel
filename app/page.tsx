import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 16 }}>
      <h1>바벨의 도서관</h1>
      <Link href="/stages/main_01-07">1-7 보드</Link>
    </main>
  );
}
