import { z } from "zod";
import { sql } from "drizzle-orm";
import { createDatabase, type Database, type Transaction } from "./client";
import { pingDatabase } from "./health";

export const TOUTES_LES_ENTITES = "toutes";

export interface Perimetre {
  utilisateurId: string;
  /** uuid d'une entité, ou TOUTES_LES_ENTITES : toutes celles que le rôle autorise. */
  entiteId: string;
}

const perimetreSchema = z.object({
  utilisateurId: z.uuid(),
  entiteId: z.union([z.uuid(), z.literal(TOUTES_LES_ENTITES)]),
});

/**
 * Seul point d'entrée des requêtes métier : ouvre une transaction et y pose le contexte lu par
 * les policies RLS (app.user_id, app.tenant_id). SET LOCAL : rien ne fuit hors de la transaction.
 */
export async function withTenant<T>(
  db: Database,
  perimetre: Perimetre,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  const { utilisateurId, entiteId } = perimetreSchema.parse(perimetre);
  const tenant = entiteId === TOUTES_LES_ENTITES ? "*" : entiteId;
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.user_id', ${utilisateurId}, true), set_config('app.tenant_id', ${tenant}, true)`,
    );
    return fn(tx);
  });
}

/** Connexion du rôle hilaac_app : n'expose que withTenant et le ping de santé. */
export function createAppDatabase(url: string) {
  const { db, close } = createDatabase(url);
  return {
    withTenant: <T>(
      perimetre: Perimetre,
      fn: (tx: Transaction) => Promise<T>,
    ) => withTenant(db, perimetre, fn),
    ping: () => pingDatabase(db),
    close,
  };
}

export type AppDatabase = ReturnType<typeof createAppDatabase>;
