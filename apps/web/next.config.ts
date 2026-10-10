import path from "node:path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(import.meta.dirname, "../..");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  turbopack: { root: monorepoRoot },
  transpilePackages: ["@hilaac/core", "@hilaac/db"],
  // Les conventions pour agents IA vivent dans CLAUDE.md, pas dans un AGENTS.md généré.
  agentRules: false,
};

export default nextConfig;
