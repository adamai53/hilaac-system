import { fileURLToPath } from "node:url";
import { databaseEnvSchema, parseEnvOrExit } from "@hilaac/core";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "../src/client";

const env = parseEnvOrExit(databaseEnvSchema, "db:migrate");
const { db, close } = createDatabase(env.DATABASE_URL, { maxConnections: 1 });

try {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url)),
  });
  console.log("Migrations appliquées.");
} finally {
  await close();
}
