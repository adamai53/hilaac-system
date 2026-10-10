import { databaseEnvSchema, parseEnvOrExit } from "@hilaac/core";
import { defineConfig } from "drizzle-kit";

const env = parseEnvOrExit(databaseEnvSchema, "drizzle-kit");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dbCredentials: { url: env.DATABASE_URL },
});
