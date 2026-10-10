import { execSync } from "node:child_process";

/** Les tests d'isolation lisent une base réelle, migrée et seedée (idempotent). */
export default function setup() {
  execSync(
    "pnpm exec tsx scripts/migrate.ts && pnpm exec tsx scripts/seed.ts",
    {
      stdio: "inherit",
    },
  );
}
