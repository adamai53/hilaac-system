import { sql } from "drizzle-orm";
import type { Database } from "./client";

/** Exécute une requête triviale et renvoie la latence en millisecondes. */
export async function pingDatabase(db: Database): Promise<number> {
  const start = performance.now();
  await db.execute(sql`select 1`);
  return Math.round(performance.now() - start);
}
