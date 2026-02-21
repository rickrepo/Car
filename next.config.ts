import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/Car",
  assetPrefix: "/Car/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
