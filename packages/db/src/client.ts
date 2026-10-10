import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export interface DatabaseOptions {
  /** Nombre maximal de connexions du pool. */
  maxConnections?: number;
}

export function createDatabase(url: string, options: DatabaseOptions = {}) {
  const client = postgres(url, {
    max: options.maxConnections ?? 10,
    connect_timeout: 5,
    onnotice: () => undefined,
  });
  const db = drizzle({ client, schema });
  return {
    db,
    close: () => client.end({ timeout: 5 }),
  };
}

export type Database = ReturnType<typeof createDatabase>["db"];
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
