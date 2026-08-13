import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/soilwatch-care-frontend",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
