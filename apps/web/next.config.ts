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
  // forbidden() : refus serveur en HTTP 403 quand un compte vise l'espace de l'autre famille.
  experimental: { authInterrupts: true },
};

export default nextConfig;
