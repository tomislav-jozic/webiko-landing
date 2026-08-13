import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    // This is a single-route site, so the default per-route CSS split
    // (root layout CSS vs. page component CSS) just adds a render-blocking
    // request for no benefit. 'graph' merges small, always-co-occurring
    // stylesheets like ours into one chunk. Turbopack-only, which we're on.
    cssChunking: "graph",
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
