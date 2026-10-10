import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { horodatage } from "./colonnes";
import { roleUtilisateur } from "./enums";
import { entite } from "./entites";

// Tables gérées par Better Auth (noms et champs français, voir auth.ts du paquet).

export const utilisateur = pgTable(
  "utilisateur",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nom: text("nom").notNull(),
    email: text("email").notNull().unique(),
    emailVerifie: boolean("email_verifie").notNull().default(false),
    image: text("image"),
    role: roleUtilisateur("role").notNull(),
    entiteId: uuid("entite_id").references(() => entite.id, {
      onDelete: "restrict",
    }),
    ...horodatage,
  },
  (t) => [
    check(
      "utilisateur_rattachement_selon_role",
      sql`(${t.role} in ('admin', 'direction', 'lead', 'membre') and ${t.entiteId} is null)
        or (${t.role} in ('referent_client', 'lecteur_client') and ${t.entiteId} is not null)`,
    ),
  ],
);

export const session = pgTable("session", {
  id: uuid("id").primaryKey().defaultRandom(),
  utilisateurId: uuid("utilisateur_id")
    .notNull()
    .references(() => utilisateur.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
  adresseIp: text("adresse_ip"),
  agentUtilisateur: text("agent_utilisateur"),
  ...horodatage,
});

export const compte = pgTable("compte", {
  id: uuid("id").primaryKey().defaultRandom(),
  utilisateurId: uuid("utilisateur_id")
    .notNull()
    .references(() => utilisateur.id, { onDelete: "cascade" }),
  identifiantCompte: text("identifiant_compte").notNull(),
  fournisseur: text("fournisseur").notNull(),
  jetonAcces: text("jeton_acces"),
  jetonRafraichissement: text("jeton_rafraichissement"),
  jetonIdentite: text("jeton_identite"),
  jetonAccesExpireLe: timestamp("jeton_acces_expire_le", {
    withTimezone: true,
  }),
  jetonRafraichissementExpireLe: timestamp("jeton_rafraichissement_expire_le", {
    withTimezone: true,
  }),
  portee: text("portee"),
  motDePasse: text("mot_de_passe"),
  ...horodatage,
});

export const verification = pgTable("verification", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifiant: text("identifiant").notNull(),
  valeur: text("valeur").notNull(),
  expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
  ...horodatage,
});
