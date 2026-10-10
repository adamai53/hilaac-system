import {
  date,
  foreignKey,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { utilisateur } from "./auth";
import { horodatage } from "./colonnes";
import { actif, entite } from "./entites";
import { reseauSocial, sourceMesure, statutPublication } from "./enums";

export const publication = pgTable(
  "publication",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entiteId: uuid("entite_id")
      .notNull()
      .references(() => entite.id, { onDelete: "cascade" }),
    actifId: uuid("actif_id").notNull(),
    reseau: reseauSocial("reseau").notNull(),
    contenu: text("contenu").notNull(),
    programmeeLe: timestamp("programmee_le", { withTimezone: true }).notNull(),
    statut: statutPublication("statut").notNull(),
    ...horodatage,
  },
  (t) => [
    foreignKey({
      name: "publication_actif_fk",
      columns: [t.actifId, t.entiteId],
      foreignColumns: [actif.id, actif.entiteId],
    }),
  ],
);

/**
 * Une valeur de métrique par jour. L'unicité rend l'écriture rejouable (upsert).
 * Convention : dimension = 'total' pour un agrégat, 'publication:<uuid>' pour l'engagement d'une publication.
 */
export const mesure = pgTable(
  "mesure",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entiteId: uuid("entite_id")
      .notNull()
      .references(() => entite.id, { onDelete: "cascade" }),
    source: sourceMesure("source").notNull(),
    cleMetrique: text("cle_metrique").notNull(),
    dimension: text("dimension").notNull().default("total"),
    date: date("date").notNull(),
    valeur: numeric("valeur", {
      precision: 18,
      scale: 4,
      mode: "number",
    }).notNull(),
    collecteLe: timestamp("collecte_le", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("mesure_unique_par_jour").on(
      t.entiteId,
      t.source,
      t.cleMetrique,
      t.dimension,
      t.date,
    ),
  ],
);

export const rawPayload = pgTable("raw_payload", {
  id: uuid("id").primaryKey().defaultRandom(),
  entiteId: uuid("entite_id")
    .notNull()
    .references(() => entite.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  endpoint: text("endpoint").notNull(),
  collecteLe: timestamp("collecte_le", { withTimezone: true })
    .notNull()
    .defaultNow(),
  charge: jsonb("charge").notNull(),
});

/** entite_id NULL : action au niveau du groupe, visible des seuls rôles admin, direction et lead. */
export const journalAudit = pgTable("journal_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  entiteId: uuid("entite_id").references(() => entite.id, {
    onDelete: "cascade",
  }),
  acteurId: uuid("acteur_id").references(() => utilisateur.id),
  action: text("action").notNull(),
  cibleType: text("cible_type").notNull(),
  cibleId: uuid("cible_id"),
  horodatage: timestamp("horodatage", { withTimezone: true })
    .notNull()
    .defaultNow(),
  etatAvant: jsonb("etat_avant"),
});
