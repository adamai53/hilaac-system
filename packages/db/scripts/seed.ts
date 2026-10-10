import { databaseEnvSchema, parseEnvOrExit } from "@hilaac/core";
import { hashPassword } from "better-auth/crypto";
import { and, getTableColumns, inArray, notInArray, sql } from "drizzle-orm";
import type {
  PgColumn,
  PgInsertValue,
  PgTable,
  PgUpdateSetSource,
} from "drizzle-orm/pg-core";
import { createDatabase, type Transaction } from "../src/client";
import {
  actif,
  affectationProjet,
  compte,
  demande,
  entite,
  jalon,
  mesure,
  projet,
  publication,
  suiviEntite,
  tache,
  tacheDependance,
  utilisateur,
} from "../src/schema";
import {
  COMPTES,
  construireDonneesDemo,
  MOT_DE_PASSE_DEMO,
} from "./demo/donnees";

if (process.env.NODE_ENV === "production") {
  console.error(
    "db:seed insère des comptes de démonstration : refusé en production.",
  );
  process.exit(1);
}

const env = parseEnvOrExit(databaseEnvSchema, "db:seed");
const { db, close } = createDatabase(env.DATABASE_URL, { maxConnections: 1 });

/** INSERT … ON CONFLICT DO UPDATE de toutes les colonnes : rejouer donne le même état. */
async function upsert<T extends PgTable>(
  tx: Transaction,
  table: T,
  lignes: PgInsertValue<T>[],
  cible: PgColumn | PgColumn[],
) {
  if (lignes.length === 0) return;
  const set = Object.fromEntries(
    Object.entries(getTableColumns(table)).map(([cle, colonne]) => [
      cle,
      sql.raw(`excluded."${colonne.name}"`),
    ]),
  ) as PgUpdateSetSource<T>;
  await tx
    .insert(table)
    .values(lignes)
    .onConflictDoUpdate({ target: cible, set });
}

const donnees = construireDonneesDemo(new Date());
const idsEntites = donnees.entites.map((e) => e.id as string);

try {
  await db.transaction(async (tx) => {
    await upsert(tx, entite, donnees.entites, entite.id);
    await upsert(tx, utilisateur, donnees.utilisateurs, utilisateur.id);

    // Mot de passe haché à la création seulement : un nouveau sel changerait l'état à chaque passage.
    const motDePasse = await hashPassword(MOT_DE_PASSE_DEMO);
    await tx
      .insert(compte)
      .values(
        donnees.utilisateurs.map((u) => ({
          id: u.id,
          utilisateurId: u.id as string,
          identifiantCompte: u.id as string,
          fournisseur: "credential",
          motDePasse,
          creeLe: u.creeLe,
          misAJourLe: u.misAJourLe,
        })),
      )
      .onConflictDoNothing({ target: compte.id });

    await upsert(tx, suiviEntite, donnees.suivis, [
      suiviEntite.utilisateurId,
      suiviEntite.entiteId,
    ]);
    await upsert(tx, actif, donnees.actifs, actif.id);
    await upsert(tx, demande, donnees.demandes, demande.id);
    await upsert(tx, projet, donnees.projets, projet.id);
    await upsert(tx, affectationProjet, donnees.affectations, [
      affectationProjet.projetId,
      affectationProjet.utilisateurId,
    ]);
    await upsert(tx, jalon, donnees.jalons, jalon.id);
    await upsert(tx, tache, donnees.taches, tache.id);
    await upsert(tx, tacheDependance, donnees.dependances, [
      tacheDependance.tacheId,
      tacheDependance.dependDeId,
    ]);
    await upsert(tx, publication, donnees.publications, publication.id);

    // Les dates glissent avec le jour du seed : on retire les mesures sorties de la fenêtre.
    await tx.delete(mesure).where(
      and(
        inArray(mesure.entiteId, idsEntites),
        notInArray(
          mesure.id,
          donnees.mesures.map((m) => m.id as string),
        ),
      ),
    );
    await upsert(tx, mesure, donnees.mesures, [
      mesure.entiteId,
      mesure.source,
      mesure.cleMetrique,
      mesure.dimension,
      mesure.date,
    ]);
  });

  console.log(
    [
      "Seed terminé :",
      `  ${donnees.entites.length} entités, ${COMPTES.length} comptes, ${donnees.actifs.length} actifs`,
      `  ${donnees.demandes.length} demandes, ${donnees.projets.length} projets, ${donnees.jalons.length} jalons, ${donnees.taches.length} tâches`,
      `  ${donnees.publications.length} publications, ${donnees.mesures.length} mesures`,
    ].join("\n"),
  );
} finally {
  await close();
}
