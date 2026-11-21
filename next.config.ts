import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: { position: "top-right" }, // default bottom-left covers the bottom nav on phones (dev only)
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
