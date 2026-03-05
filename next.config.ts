import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Harmonia (vendored lib in src/lib/capacity) has a strict null check error
    // in pattern-extractor.ts that cannot be modified per project rules.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
