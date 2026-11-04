import type { Metadata } from "next";
import { Barlow_Condensed, JetBrains_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_KR({ variable: "--font-noto", weight: ["400", "700", "900"], preload: false });
const barlow = Barlow_Condensed({ variable: "--font-barlow", weight: ["500", "700"], subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", weight: ["400", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "바벨의 도서관",
  description: "명일방주 스테이지 공략 보드 (비공식 팬 사이트)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${noto.variable} ${barlow.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
