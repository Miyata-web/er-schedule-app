import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages デプロイ時は @cloudflare/next-on-pages が
  // ビルド出力を変換するため、特別な設定は不要。
};

export default nextConfig;
