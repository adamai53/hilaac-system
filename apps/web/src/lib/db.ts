import { createAppDatabase, type AppDatabase } from "@hilaac/db";
import { getWebEnv } from "./env";

// Conservé sur globalThis pour ne pas multiplier les pools lors du rechargement à chaud.
const globalForDb = globalThis as typeof globalThis & {
  hilaacAppDb?: AppDatabase;
};

/** Connexion du rôle hilaac_app : toute lecture métier passe par withTenant. */
export function getAppDb(): AppDatabase {
  globalForDb.hilaacAppDb ??= createAppDatabase(getWebEnv().DATABASE_URL_APP);
  return globalForDb.hilaacAppDb;
}
