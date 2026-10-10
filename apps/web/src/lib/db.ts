import { createDatabase } from "@hilaac/db";
import { getWebEnv } from "./env";

type DatabaseHandle = ReturnType<typeof createDatabase>;

// Conservé sur globalThis pour ne pas multiplier les pools lors du rechargement à chaud.
const globalForDb = globalThis as typeof globalThis & {
  hilaacDb?: DatabaseHandle;
};

export function getDb() {
  globalForDb.hilaacDb ??= createDatabase(getWebEnv().DATABASE_URL);
  return globalForDb.hilaacDb.db;
}
