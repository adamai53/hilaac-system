import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import type { Transaction } from "../client";
import { demande, entite, mesure, publication, utilisateur } from "../schema";
import { entiteParId, projetEnCours, serieMesure } from "./communes";

/** Entité du client : la seule que la base lui laisse voir. */
async function entiteDuClient(tx: Transaction) {
  const visibles = await tx.select({ id: entite.id }).from(entite).limit(2);
  const [unique] = visibles;
  if (!unique || visibles.length > 1) return null;
  return entiteParId(tx, unique.id);
}

export async function accueilPortail(tx: Transaction) {
  const fiche = await entiteDuClient(tx);
  if (!fiche) return null;

  const [demandes, publicationsAValider, projet] = await Promise.all([
    tx
      .select({
        id: demande.id,
        titre: demande.titre,
        type: demande.type,
        urgence: demande.urgence,
        statut: demande.statut,
        echeance: demande.echeance,
        creeLe: demande.creeLe,
        auteur: utilisateur.nom,
      })
      .from(demande)
      .leftJoin(utilisateur, eq(utilisateur.id, demande.auteurId))
      .where(eq(demande.entiteId, fiche.id))
      .orderBy(desc(demande.creeLe)),
    tx
      .select({
        id: publication.id,
        reseau: publication.reseau,
        contenu: publication.contenu,
        programmeeLe: publication.programmeeLe,
      })
      .from(publication)
      .where(
        and(
          eq(publication.entiteId, fiche.id),
          eq(publication.statut, "en_validation"),
        ),
      )
      .orderBy(asc(publication.programmeeLe)),
    projetEnCours(tx, fiche.id),
  ]);
  return {
    entite: fiche,
    demandes,
    aValider: {
      demandes: demandes.filter((d) => d.statut === "en_attente_validation"),
      publications: publicationsAValider,
    },
    projet,
  };
}

export async function performancePortail(tx: Transaction) {
  const fiche = await entiteDuClient(tx);
  if (!fiche) return null;

  const debutMois = sql`date_trunc('month', current_date)`;
  // Convention de mesure : l'engagement d'une publication porte dimension = 'publication:<uuid>'.
  const engagement = tx
    .select({
      dimension: mesure.dimension,
      total: sql<number>`sum(${mesure.valeur})::float8`.as("total"),
    })
    .from(mesure)
    .where(
      and(eq(mesure.entiteId, fiche.id), eq(mesure.cleMetrique, "engagement")),
    )
    .groupBy(mesure.dimension)
    .as("engagement_par_publication");

  const [trafic, leads, publicationsDuMois] = await Promise.all([
    serieMesure(tx, { entiteId: fiche.id, source: "ga4", cle: "sessions" }, 60),
    serieMesure(
      tx,
      { entiteId: fiche.id, source: "formulaire_site", cle: "leads" },
      60,
    ),
    tx
      .select({
        id: publication.id,
        reseau: publication.reseau,
        contenu: publication.contenu,
        programmeeLe: publication.programmeeLe,
        engagement: sql<number>`coalesce(${engagement.total}, 0)`,
      })
      .from(publication)
      .leftJoin(
        engagement,
        eq(
          engagement.dimension,
          sql`'publication:' || ${publication.id}::text`,
        ),
      )
      .where(
        and(
          eq(publication.entiteId, fiche.id),
          eq(publication.statut, "publiee"),
          gte(publication.programmeeLe, debutMois),
          lt(publication.programmeeLe, sql`${debutMois} + interval '1 month'`),
        ),
      )
      .orderBy(desc(publication.programmeeLe)),
  ]);
  return { entite: fiche, trafic, leads, publicationsDuMois };
}
