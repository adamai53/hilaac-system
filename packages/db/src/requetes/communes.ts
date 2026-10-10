import {
  aliasedTable,
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ne,
  sql,
} from "drizzle-orm";
import type { Transaction } from "../client";
import {
  entite,
  jalon,
  mesure,
  projet,
  publication,
  tache,
  utilisateur,
} from "../schema";

export const responsable = aliasedTable(utilisateur, "responsable");

/** Série quotidienne d'une métrique agrégée ('total') sur les `jours` derniers jours, jour inclus. */
export async function serieMesure(
  tx: Transaction,
  filtre: {
    entiteId?: string;
    source: (typeof mesure.source.enumValues)[number];
    cle: string;
  },
  jours: number,
) {
  return tx
    .select({
      date: mesure.date,
      valeur: sql<number>`sum(${mesure.valeur})::float8`,
    })
    .from(mesure)
    .where(
      and(
        filtre.entiteId ? eq(mesure.entiteId, filtre.entiteId) : undefined,
        eq(mesure.source, filtre.source),
        eq(mesure.cleMetrique, filtre.cle),
        eq(mesure.dimension, "total"),
        gte(mesure.date, sql`current_date - ${jours - 1}::int`),
      ),
    )
    .groupBy(mesure.date)
    .orderBy(asc(mesure.date));
}

/** Projet en cours d'une entité, avec ses jalons et l'avancement de ses tâches. */
export async function projetEnCours(tx: Transaction, entiteId: string) {
  const [courant] = await tx
    .select({
      id: projet.id,
      nom: projet.nom,
      description: projet.description,
      dateDebut: projet.dateDebut,
      dateFinPrevue: projet.dateFinPrevue,
      responsable: responsable.nom,
    })
    .from(projet)
    .leftJoin(responsable, eq(responsable.id, projet.responsableId))
    .where(and(eq(projet.entiteId, entiteId), eq(projet.statut, "en_cours")))
    .orderBy(asc(projet.dateFinPrevue))
    .limit(1);
  if (!courant) return null;

  const [jalons, avancement] = await Promise.all([
    tx
      .select({
        id: jalon.id,
        titre: jalon.titre,
        echeance: jalon.echeance,
        statut: jalon.statut,
      })
      .from(jalon)
      .where(eq(jalon.projetId, courant.id))
      .orderBy(asc(jalon.echeance)),
    tx
      .select({ statut: tache.statut, nombre: count() })
      .from(tache)
      .where(eq(tache.projetId, courant.id))
      .groupBy(tache.statut),
  ]);
  const total = avancement.reduce((somme, ligne) => somme + ligne.nombre, 0);
  const terminees =
    avancement.find((ligne) => ligne.statut === "terminee")?.nombre ?? 0;
  return { ...courant, jalons, taches: { total, terminees } };
}

export async function dernieresPublications(
  tx: Transaction,
  entiteId: string,
  limite: number,
) {
  return tx
    .select({
      id: publication.id,
      reseau: publication.reseau,
      contenu: publication.contenu,
      programmeeLe: publication.programmeeLe,
      statut: publication.statut,
    })
    .from(publication)
    .where(eq(publication.entiteId, entiteId))
    .orderBy(desc(publication.programmeeLe))
    .limit(limite);
}

export async function entiteParId(tx: Transaction, entiteId: string) {
  const [ligne] = await tx
    .select({
      id: entite.id,
      nom: entite.nom,
      secteur: entite.secteur,
      couleurMarque: entite.couleurMarque,
      logoUrl: entite.logoUrl,
    })
    .from(entite)
    .where(eq(entite.id, entiteId));
  return ligne ?? null;
}

export const tacheOuverte = () => ne(tache.statut, "terminee");
