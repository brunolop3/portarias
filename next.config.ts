import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // pdf-to-img (pdfjs-dist + @napi-rs/canvas) carrega um worker/binários em
  // runtime; empacotá-los quebra a resolução do worker. Mantê-los externos
  // faz o Node resolver via require normal.
  serverExternalPackages: ["pdf-to-img", "pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
