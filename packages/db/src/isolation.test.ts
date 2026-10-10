import { databaseEnvSchema, parseEnv, webEnvSchema } from "@hilaac/core";
import { DrizzleQueryError, sql, TransactionRollbackError } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { idDemo } from "../scripts/demo/donnees";
import { createDatabase, type Transaction } from "./client";
import { journalAudit, rawPayload } from "./schema";
import { createAppDatabase } from "./tenant";

// Tests d'intégration : base migrée et seedée par globalSetup (vitest.config.ts).

const proprietaire = createDatabase(
  parseEnv(databaseEnvSchema, "test").DATABASE_URL,
  {
    maxConnections: 2,
  },
);
const app = createAppDatabase(
  parseEnv(webEnvSchema.pick({ DATABASE_URL_APP: true }), "test")
    .DATABASE_URL_APP,
);

afterAll(async () => {
  await Promise.all([proprietaire.close(), app.close()]);
});

const ENTITE_A = idDemo("entite:kelvane");
const ENTITE_B = idDemo("entite:sablon");
const REFERENT_A = idDemo("utilisateur:referent-kelvane");
const REFERENT_B = idDemo("utilisateur:referent-sablon");
const MEMBRE_ORVIA = idDemo("utilisateur:membre2");
const MEMBRE_KELVANE_SABLON = idDemo("utilisateur:membre1");
const LEAD = idDemo("utilisateur:lead");

/** Tables portant entite_id, avec la colonne qui porte l'entité. */
const TABLES_CLOISONNEES = [
  ["entite", "id"],
  ["suivi_entite", "entite_id"],
  ["actif", "entite_id"],
  ["demande", "entite_id"],
  ["projet", "entite_id"],
  ["affectation_projet", "entite_id"],
  ["jalon", "entite_id"],
  ["tache", "entite_id"],
  ["tache_dependance", "entite_id"],
  ["publication", "entite_id"],
  ["mesure", "entite_id"],
  ["raw_payload", "entite_id"],
  ["journal_audit", "entite_id"],
] as const;

interface Contexte {
  role: "hilaac_app" | "hilaac_worker";
  utilisateurId?: string;
  tenant?: string;
}

/**
 * Exécute `fn` sous un rôle donné, dans une transaction annulée à la fin. Des lignes témoins sont
 * ajoutées aux tables que le seed laisse vides, pour que chaque table ait des lignes de A et de B.
 */
async function enTantQue<T>(
  contexte: Contexte,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  let resultat: { valeur: T } | undefined;
  try {
    await proprietaire.db.transaction(async (tx) => {
      await tx.insert(rawPayload).values(
        [ENTITE_A, ENTITE_B].map((entiteId) => ({
          entiteId,
          source: "test",
          endpoint: "/temoin",
          charge: { temoin: true },
        })),
      );
      await tx.insert(journalAudit).values([
        { entiteId: ENTITE_A, action: "temoin", cibleType: "test" },
        { entiteId: ENTITE_B, action: "temoin", cibleType: "test" },
        { entiteId: null, action: "temoin", cibleType: "groupe" },
      ]);
      await tx.execute(sql`select set_config('role', ${contexte.role}, true)`);
      if (contexte.utilisateurId) {
        await tx.execute(
          sql`select set_config('app.user_id', ${contexte.utilisateurId}, true)`,
        );
      }
      if (contexte.tenant) {
        await tx.execute(
          sql`select set_config('app.tenant_id', ${contexte.tenant}, true)`,
        );
      }
      resultat = { valeur: await fn(tx) };
      tx.rollback();
    });
  } catch (erreur) {
    if (!(erreur instanceof TransactionRollbackError)) throw erreur;
  }
  if (!resultat) throw new Error("La transaction de test n'a pas abouti.");
  return resultat.valeur;
}

async function compter(
  tx: Transaction,
  table: string,
  colonne: string,
  entiteId: string,
) {
  const [ligne] = await tx.execute<{ n: number }>(
    sql`select count(*)::int as n from ${sql.identifier(table)} where ${sql.identifier(colonne)} = ${entiteId}`,
  );
  return ligne?.n ?? 0;
}

/** Vérifie que Postgres a refusé la requête faute de droit (SQLSTATE 42501). */
async function attendreRefus(promesse: Promise<unknown>) {
  const erreur = await promesse.then(
    () => null,
    (e: unknown) => e,
  );
  expect(erreur).toBeInstanceOf(DrizzleQueryError);
  expect((erreur as DrizzleQueryError).cause).toMatchObject({ code: "42501" });
}

async function idsVisibles(tx: Transaction, table: string) {
  const lignes = await tx.execute<{ id: string }>(
    sql`select id from ${sql.identifier(table)}`,
  );
  return lignes.map((l) => l.id);
}

describe("isolation par entité (RLS)", () => {
  describe.each(TABLES_CLOISONNEES)("%s", (table, colonne) => {
    it("tenant = A : aucune ligne de B, des lignes de A", async () => {
      const [deA, deB] = await enTantQue(
        { role: "hilaac_app", utilisateurId: REFERENT_A, tenant: ENTITE_A },
        (tx) =>
          Promise.all([
            compter(tx, table, colonne, ENTITE_A),
            compter(tx, table, colonne, ENTITE_B),
          ]),
      );
      expect(deB).toBe(0);
      expect(deA).toBeGreaterThan(0);
    });

    it("référent de A qui force tenant = B : aucune ligne du tout", async () => {
      const [deA, deB] = await enTantQue(
        { role: "hilaac_app", utilisateurId: REFERENT_A, tenant: ENTITE_B },
        (tx) =>
          Promise.all([
            compter(tx, table, colonne, ENTITE_A),
            compter(tx, table, colonne, ENTITE_B),
          ]),
      );
      expect(deA + deB).toBe(0);
    });

    it("sans contexte : aucune ligne (fail-closed)", async () => {
      const [deA, deB] = await enTantQue({ role: "hilaac_app" }, (tx) =>
        Promise.all([
          compter(tx, table, colonne, ENTITE_A),
          compter(tx, table, colonne, ENTITE_B),
        ]),
      );
      expect(deA + deB).toBe(0);
    });
  });

  it("utilisateur : le référent de A ne voit aucun compte rattaché à B", async () => {
    const ids = await enTantQue(
      { role: "hilaac_app", utilisateurId: REFERENT_A, tenant: ENTITE_A },
      (tx) => idsVisibles(tx, "utilisateur"),
    );
    expect(ids).toContain(REFERENT_A);
    expect(ids).not.toContain(REFERENT_B);
  });

  it("la connexion réelle hilaac_app via withTenant ne voit pas B, même en le forçant", async () => {
    const lignes = await app.withTenant(
      { utilisateurId: REFERENT_A, entiteId: ENTITE_B },
      (tx) =>
        tx.execute<{ n: number }>(sql`select count(*)::int as n from entite`),
    );
    expect(lignes[0]?.n).toBe(0);
  });

  it("le worker (BYPASSRLS) voit toutes les entités", async () => {
    const [ligne] = await enTantQue({ role: "hilaac_worker" }, (tx) =>
      tx.execute<{ n: number }>(sql`select count(*)::int as n from entite`),
    );
    expect(ligne?.n).toBe(3);
  });

  it("hilaac_app ne peut pas écrire", async () => {
    await attendreRefus(
      enTantQue(
        { role: "hilaac_app", utilisateurId: LEAD, tenant: "*" },
        (tx) => tx.execute(sql`update entite set nom = nom`),
      ),
    );
  });
});

describe("fonctions de périmètre", () => {
  it("appartiennent à hilaac_rls, qui ignore RLS et ne se connecte pas", async () => {
    const lignes = await proprietaire.db.execute<{
      proprietaire: string;
      bypass: boolean;
      login: boolean;
    }>(sql`
      select distinct r.rolname as proprietaire, r.rolbypassrls as bypass, r.rolcanlogin as login
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      join pg_roles r on r.oid = p.proowner
      where n.nspname = 'app'
    `);
    expect(lignes).toEqual([
      { proprietaire: "hilaac_rls", bypass: true, login: false },
    ]);
  });

  // Si une fonction de périmètre redevient soumise à RLS, cette lecture échoue par récursion
  // (« infinite recursion detected in policy ») ou renvoie zéro ligne en silence.
  it("pas de récursion : un membre lit ses lignes de suivi_entite", async () => {
    const lignes = await enTantQue(
      { role: "hilaac_app", utilisateurId: MEMBRE_ORVIA, tenant: "*" },
      (tx) =>
        tx.execute<{ entite_id: string }>(
          sql`select entite_id from suivi_entite where utilisateur_id = ${MEMBRE_ORVIA}`,
        ),
    );
    expect(lignes).toHaveLength(3);
  });

  it("un membre sans ligne de suivi ne voit aucune entité", async () => {
    const [ligne] = await enTantQue(
      { role: "hilaac_app", utilisateurId: MEMBRE_ORVIA, tenant: "*" },
      async (tx) => {
        await tx.execute(sql`select set_config('role', 'hilaac', true)`);
        await tx.execute(
          sql`delete from suivi_entite where utilisateur_id = ${MEMBRE_ORVIA}`,
        );
        await tx.execute(sql`select set_config('role', 'hilaac_app', true)`);
        return tx.execute<{ n: number }>(
          sql`select count(*)::int as n from entite`,
        );
      },
    );
    expect(ligne?.n).toBe(0);
  });
});

describe("visibilité des projets pour un membre", () => {
  it("voit seulement les projets où il est affecté", async () => {
    const ids = await enTantQue(
      { role: "hilaac_app", utilisateurId: MEMBRE_ORVIA, tenant: "*" },
      (tx) => idsVisibles(tx, "projet"),
    );
    expect(ids).toEqual([idDemo("orvia:projet")]);
  });

  it("voit une tâche dont il est responsable hors de ses projets, et rien d'autre de ce projet", async () => {
    const ids = await enTantQue(
      { role: "hilaac_app", utilisateurId: MEMBRE_ORVIA, tenant: ENTITE_A },
      (tx) => idsVisibles(tx, "tache"),
    );
    expect(ids).toEqual([idDemo("kelvane:tache:video-flotte")]);
  });

  it("direction et lead voient tous les projets", async () => {
    const ids = await enTantQue(
      { role: "hilaac_app", utilisateurId: LEAD, tenant: "*" },
      (tx) => idsVisibles(tx, "projet"),
    );
    expect(ids).toHaveLength(3);
  });
});

describe("annuaire côté client", () => {
  it("un référent client ne peut lire aucun email", async () => {
    await attendreRefus(
      enTantQue(
        { role: "hilaac_app", utilisateurId: REFERENT_B, tenant: ENTITE_B },
        (tx) => tx.execute(sql`select email from utilisateur`),
      ),
    );
  });

  it("voit les intervenants de son entité, pas un membre qui n'y intervient pas", async () => {
    const ids = await enTantQue(
      { role: "hilaac_app", utilisateurId: REFERENT_B, tenant: ENTITE_B },
      (tx) => idsVisibles(tx, "utilisateur"),
    );
    expect(ids).toEqual(
      expect.arrayContaining([REFERENT_B, LEAD, MEMBRE_KELVANE_SABLON]),
    );
    expect(ids).not.toContain(MEMBRE_ORVIA);
    expect(ids).not.toContain(idDemo("utilisateur:admin"));
    expect(ids).not.toContain(REFERENT_A);
  });
});
