import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 게임 아이콘은 id로 고정된 파일이라 브라우저에 1년 캐시: Vercel CDN 요청 수 절약
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
