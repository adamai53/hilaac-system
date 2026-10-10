import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./vitest.global-setup.ts"],
    // Une seule base partagée : les fichiers de test ne tournent pas en parallèle.
    fileParallelism: false,
  },
});
