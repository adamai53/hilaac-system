import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/main.ts"],
  format: "esm",
  platform: "node",
  target: "node24",
  outDir: "dist",
  clean: true,
  // Les paquets du workspace sont embarqués ; les dépendances npm restent externes.
  deps: { alwaysBundle: [/^@hilaac\//] },
});
