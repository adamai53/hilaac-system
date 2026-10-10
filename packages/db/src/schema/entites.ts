import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  primaryKey,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { horodatage } from "./colonnes";
import { roleSuivi, typeActif } from "./enums";
import { utilisateur } from "./auth";

export const entite = pgTable(
  "entite",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nom: text("nom").notNull(),
    slug: text("slug").notNull().unique(),
    secteur: text("secteur").notNull(),
    couleurMarque: text("couleur_marque").notNull(),
    logoUrl: text("logo_url"),
    ...horodatage,
  },
  (t) => [
    check(
      "entite_couleur_marque_hex",
      sql`${t.couleurMarque} ~ '^#[0-9A-Fa-f]{6}$'`,
    ),
  ],
);

/** Membres de l'équipe qui suivent une entité. Un client se rattache par utilisateur.entite_id. */
export const suiviEntite = pgTable(
  "suivi_entite",
  {
    utilisateurId: uuid("utilisateur_id")
      .notNull()
      .references(() => utilisateur.id, { onDelete: "cascade" }),
    entiteId: uuid("entite_id")
      .notNull()
      .references(() => entite.id, { onDelete: "cascade" }),
    role: roleSuivi("role").notNull(),
    ...horodatage,
  },
  (t) => [primaryKey({ columns: [t.utilisateurId, t.entiteId] })],
);

export const actif = pgTable(
  "actif",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entiteId: uuid("entite_id")
      .notNull()
      .references(() => entite.id, { onDelete: "cascade" }),
    type: typeActif("type").notNull(),
    libelle: text("libelle").notNull(),
    identifiant: text("identifiant").notNull(),
    fournisseur: text("fournisseur").notNull(),
    ...horodatage,
  },
  (t) => [unique("actif_id_entite").on(t.id, t.entiteId)],
);
