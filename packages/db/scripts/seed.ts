import { databaseEnvSchema, parseEnvOrExit } from "@hilaac/core";
import { createDatabase } from "../src/client";
import { pingDatabase } from "../src/health";

const env = parseEnvOrExit(databaseEnvSchema, "db:seed");
const { db, close } = createDatabase(env.DATABASE_URL, { maxConnections: 1 });

try {
  await pingDatabase(db);
  // Aucune table métier dans le socle : les insertions de seed s'ajoutent ici avec les tables.
  console.log("Seed terminé : aucune donnée à insérer.");
} finally {
  await close();
}
