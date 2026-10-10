import { execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log(".env créé depuis .env.example");
}

execSync("pnpm db:up", { stdio: "inherit" });
execSync("pnpm db:migrate", { stdio: "inherit" });
