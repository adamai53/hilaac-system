import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  lt,
  lte,
  ne,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import type { Transaction } from "../client";
import {
  actif,
  demande,
  entite,
  jalon,
  projet,
  tache,
  utilisateur,
} from "../schema";
import {
  dernieresPublications,
  entiteParId,
  projetEnCours,
  serieMesure,
  tacheOuverte,
} from "./communes";

const STATUTS_DEMANDE_CLOS = ["terminee", "refusee"] as const;

/** Entités visibles dans le périmètre courant, pour le sélecteur et la liste. */
export async function listerEntites(tx: Transaction) {
  // Jointures sur des agrégats plutôt que des sous-requêtes corrélées : sur une requête à table
  // unique, Drizzle n'y préfixe pas les colonnes externes, qui seraient résolues sur la sous-requête.
  const demandesOuvertes = tx
    .select({
      entiteId: demande.entiteId,
      nombre: count().as("nb_demandes_ouvertes"),
    })
    .from(demande)
    .where(notInArray(demande.statut, [...STATUTS_DEMANDE_CLOS]))
    .groupBy(demande.entiteId)
    .as("demandes_ouvertes");
  const actifs = tx
    .select({ entiteId: actif.entiteId, nombre: count().as("nb_actifs") })
    .from(actif)
    .groupBy(actif.entiteId)
    .as("actifs_par_entite");
  const projetsEnCours = tx
    .selectDistinctOn([projet.entiteId], {
      entiteId: projet.entiteId,
      nom: projet.nom,
    })
    .from(projet)
    .where(eq(projet.statut, "en_cours"))
    .orderBy(projet.entiteId, asc(projet.dateFinPrevue))
    .as("projets_en_cours");

  return tx
    .select({
      id: entite.id,
      nom: entite.nom,
      secteur: entite.secteur,
      couleurMarque: entite.couleurMarque,
      demandesOuvertes: sql<number>`coalesce(${demandesOuvertes.nombre}, 0)::int`,
      actifs: sql<number>`coalesce(${actifs.nombre}, 0)::int`,
      projetEnCours: projetsEnCours.nom,
    })
    .from(entite)
    .leftJoin(demandesOuvertes, eq(demandesOuvertes.entiteId, entite.id))
    .leftJoin(actifs, eq(actifs.entiteId, entite.id))
    .leftJoin(projetsEnCours, eq(projetsEnCours.entiteId, entite.id))
    .orderBy(asc(entite.nom));
}

const tacheAvecContexte = {
  id: tache.id,
  titre: tache.titre,
  statut: tache.statut,
  equipe: tache.equipe,
  echeance: tache.echeance,
  projet: projet.nom,
  entite: entite.nom,
};

export async function accueilEquipe(tx: Transaction, utilisateurId: string) {
  const mesTaches = (condition: ReturnType<typeof eq>) =>
    tx
      .select(tacheAvecContexte)
      .from(tache)
      .innerJoin(entite, eq(entite.id, tache.entiteId))
      // Projet invisible (membre non affecté) : la tâche reste listée, sans nom de projet.
      .leftJoin(projet, eq(projet.id, tache.projetId))
      .where(
        and(eq(tache.responsableId, utilisateurId), condition, tacheOuverte()),
      )
      .orderBy(asc(tache.echeance), asc(entite.nom));

  const [tachesDuJour, retards, demandesAQualifier, jalonsARisque] =
    await Promise.all([
      mesTaches(eq(tache.echeance, sql`current_date`)),
      mesTaches(lt(tache.echeance, sql`current_date`)),
      tx
        .select({
          id: demande.id,
          titre: demande.titre,
          type: demande.type,
          urgence: demande.urgence,
          creeLe: demande.creeLe,
          entite: entite.nom,
          auteur: utilisateur.nom,
        })
        .from(demande)
        .innerJoin(entite, eq(entite.id, demande.entiteId))
        .leftJoin(utilisateur, eq(utilisateur.id, demande.auteurId))
        .where(eq(demande.statut, "a_qualifier"))
        .orderBy(desc(demande.creeLe)),
      tx
        .select({
          id: jalon.id,
          titre: jalon.titre,
          echeance: jalon.echeance,
          statut: jalon.statut,
          projet: projet.nom,
          entite: entite.nom,
          tachesOuvertes: sql<number>`(
          select count(*)::int from ${tache}
          where ${tache.jalonId} = ${jalon.id} and ${tacheOuverte()}
        )`,
        })
        .from(jalon)
        .innerJoin(projet, eq(projet.id, jalon.projetId))
        .innerJoin(entite, eq(entite.id, jalon.entiteId))
        .where(
          and(
            ne(jalon.statut, "atteint"),
            // À risque : échéance dépassée, ou dans 7 jours ou moins avec des tâches ouvertes.
            or(
              lt(jalon.echeance, sql`current_date`),
              and(
                lte(jalon.echeance, sql`current_date + 7`),
                exists(
                  tx
                    .select({ un: sql`1` })
                    .from(tache)
                    .where(and(eq(tache.jalonId, jalon.id), tacheOuverte())),
                ),
              ),
            ),
          ),
        )
        .orderBy(asc(jalon.echeance)),
    ]);
  return { tachesDuJour, retards, demandesAQualifier, jalonsARisque };
}

/** Fiche d'une entité. null si l'entité est hors périmètre : c'est la base qui l'a filtrée. */
export async function ficheEntite(tx: Transaction, entiteId: string) {
  const fiche = await entiteParId(tx, entiteId);
  if (!fiche) return null;

  const [actifs, demandes, projet, publications, trafic] = await Promise.all([
    tx
      .select({
        id: actif.id,
        type: actif.type,
        libelle: actif.libelle,
        identifiant: actif.identifiant,
        fournisseur: actif.fournisseur,
      })
      .from(actif)
      .where(eq(actif.entiteId, entiteId))
      .orderBy(asc(actif.type), asc(actif.libelle)),
    tx
      .select({
        id: demande.id,
        titre: demande.titre,
        type: demande.type,
        urgence: demande.urgence,
        statut: demande.statut,
        echeance: demande.echeance,
        auteur: utilisateur.nom,
      })
      .from(demande)
      .leftJoin(utilisateur, eq(utilisateur.id, demande.auteurId))
      .where(
        and(
          eq(demande.entiteId, entiteId),
          notInArray(demande.statut, [...STATUTS_DEMANDE_CLOS]),
        ),
      )
      .orderBy(asc(demande.echeance)),
    projetEnCours(tx, entiteId),
    dernieresPublications(tx, entiteId, 5),
    serieMesure(tx, { entiteId, source: "ga4", cle: "sessions" }, 60),
  ]);
  return { entite: fiche, actifs, demandes, projet, publications, trafic };
}
