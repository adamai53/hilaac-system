import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  pgTable,
  primaryKey,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { utilisateur } from "./auth";
import { horodatage } from "./colonnes";
import { entite } from "./entites";
import {
  equipeTache,
  statutDemande,
  statutJalon,
  statutProjet,
  statutTache,
  typeDemande,
  urgenceDemande,
} from "./enums";

const refEntite = () =>
  uuid("entite_id")
    .notNull()
    .references(() => entite.id, { onDelete: "cascade" });

export const demande = pgTable(
  "demande",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entiteId: refEntite(),
    type: typeDemande("type").notNull(),
    titre: text("titre").notNull(),
    brief: text("brief").notNull(),
    urgence: urgenceDemande("urgence").notNull(),
    statut: statutDemande("statut").notNull(),
    echeance: date("echeance"),
    auteurId: uuid("auteur_id")
      .notNull()
      .references(() => utilisateur.id),
    ...horodatage,
  },
  (t) => [unique("demande_id_entite").on(t.id, t.entiteId)],
);

export const projet = pgTable(
  "projet",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entiteId: refEntite(),
    demandeId: uuid("demande_id"),
    nom: text("nom").notNull(),
    description: text("description").notNull(),
    responsableId: uuid("responsable_id")
      .notNull()
      .references(() => utilisateur.id),
    statut: statutProjet("statut").notNull(),
    dateDebut: date("date_debut").notNull(),
    dateFinPrevue: date("date_fin_prevue").notNull(),
    ...horodatage,
  },
  (t) => [
    unique("projet_id_entite").on(t.id, t.entiteId),
    foreignKey({
      name: "projet_demande_fk",
      columns: [t.demandeId, t.entiteId],
      foreignColumns: [demande.id, demande.entiteId],
    }),
  ],
);

/** Équipe d'un projet : un membre ne voit que les projets où il est affecté. */
export const affectationProjet = pgTable(
  "affectation_projet",
  {
    projetId: uuid("projet_id").notNull(),
    utilisateurId: uuid("utilisateur_id")
      .notNull()
      .references(() => utilisateur.id, { onDelete: "cascade" }),
    entiteId: refEntite(),
    ...horodatage,
  },
  (t) => [
    primaryKey({ columns: [t.projetId, t.utilisateurId] }),
    foreignKey({
      name: "affectation_projet_projet_fk",
      columns: [t.projetId, t.entiteId],
      foreignColumns: [projet.id, projet.entiteId],
    }).onDelete("cascade"),
  ],
);

export const jalon = pgTable(
  "jalon",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entiteId: refEntite(),
    projetId: uuid("projet_id").notNull(),
    titre: text("titre").notNull(),
    echeance: date("echeance").notNull(),
    statut: statutJalon("statut").notNull(),
    ...horodatage,
  },
  (t) => [
    unique("jalon_id_entite").on(t.id, t.entiteId),
    foreignKey({
      name: "jalon_projet_fk",
      columns: [t.projetId, t.entiteId],
      foreignColumns: [projet.id, projet.entiteId],
    }).onDelete("cascade"),
  ],
);

export const tache = pgTable(
  "tache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entiteId: refEntite(),
    projetId: uuid("projet_id").notNull(),
    jalonId: uuid("jalon_id"),
    titre: text("titre").notNull(),
    responsableId: uuid("responsable_id").references(() => utilisateur.id),
    equipe: equipeTache("equipe").notNull(),
    statut: statutTache("statut").notNull(),
    echeance: date("echeance"),
    ...horodatage,
  },
  (t) => [
    unique("tache_id_entite").on(t.id, t.entiteId),
    foreignKey({
      name: "tache_projet_fk",
      columns: [t.projetId, t.entiteId],
      foreignColumns: [projet.id, projet.entiteId],
    }).onDelete("cascade"),
    foreignKey({
      name: "tache_jalon_fk",
      columns: [t.jalonId, t.entiteId],
      foreignColumns: [jalon.id, jalon.entiteId],
    }),
  ],
);

export const tacheDependance = pgTable(
  "tache_dependance",
  {
    tacheId: uuid("tache_id").notNull(),
    dependDeId: uuid("depend_de_id").notNull(),
    entiteId: refEntite(),
    ...horodatage,
  },
  (t) => [
    primaryKey({ columns: [t.tacheId, t.dependDeId] }),
    check("tache_dependance_distincte", sql`${t.tacheId} <> ${t.dependDeId}`),
    foreignKey({
      name: "tache_dependance_tache_fk",
      columns: [t.tacheId, t.entiteId],
      foreignColumns: [tache.id, tache.entiteId],
    }).onDelete("cascade"),
    foreignKey({
      name: "tache_dependance_depend_de_fk",
      columns: [t.dependDeId, t.entiteId],
      foreignColumns: [tache.id, tache.entiteId],
    }).onDelete("cascade"),
  ],
);
