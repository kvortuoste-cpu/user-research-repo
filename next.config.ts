import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // pdfjs-dist optionally requires 'canvas' for server-side rendering.
      // We only parse PDFs in the browser, so stub it out.
      canvas: "./canvas-stub.js",
    },
  },
  webpack: (config) => {
    // Same alias for webpack (used in tests / non-Turbopack CI builds)
    config.resolve.alias["canvas"] = path.resolve("canvas-stub.js");
    return config;
  },
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
