CREATE TYPE "public"."equipe_tache" AS ENUM('dev', 'graphisme', 'redaction', 'photo_video', 'marketing');--> statement-breakpoint
CREATE TYPE "public"."reseau_social" AS ENUM('facebook', 'linkedin');--> statement-breakpoint
CREATE TYPE "public"."role_suivi" AS ENUM('referent', 'contributeur');--> statement-breakpoint
CREATE TYPE "public"."role_utilisateur" AS ENUM('admin', 'direction', 'lead', 'membre', 'referent_client', 'lecteur_client');--> statement-breakpoint
CREATE TYPE "public"."source_mesure" AS ENUM('ga4', 'facebook', 'linkedin', 'formulaire_site');--> statement-breakpoint
CREATE TYPE "public"."statut_demande" AS ENUM('a_qualifier', 'qualifiee', 'en_cours', 'en_attente_validation', 'terminee', 'refusee');--> statement-breakpoint
CREATE TYPE "public"."statut_jalon" AS ENUM('a_venir', 'en_cours', 'atteint');--> statement-breakpoint
CREATE TYPE "public"."statut_projet" AS ENUM('planifie', 'en_cours', 'en_pause', 'termine');--> statement-breakpoint
CREATE TYPE "public"."statut_publication" AS ENUM('brouillon', 'en_validation', 'programmee', 'publiee', 'echec');--> statement-breakpoint
CREATE TYPE "public"."statut_tache" AS ENUM('a_faire', 'en_cours', 'en_revue', 'bloquee', 'terminee');--> statement-breakpoint
CREATE TYPE "public"."type_actif" AS ENUM('site', 'domaine', 'hebergement', 'compte_social', 'compte_mesure');--> statement-breakpoint
CREATE TYPE "public"."type_demande" AS ENUM('site_web', 'contenu_social', 'campagne', 'seo', 'maintenance', 'autre');--> statement-breakpoint
CREATE TYPE "public"."urgence_demande" AS ENUM('basse', 'normale', 'haute', 'critique');--> statement-breakpoint
CREATE TABLE "compte" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"utilisateur_id" uuid NOT NULL,
	"identifiant_compte" text NOT NULL,
	"fournisseur" text NOT NULL,
	"jeton_acces" text,
	"jeton_rafraichissement" text,
	"jeton_identite" text,
	"jeton_acces_expire_le" timestamp with time zone,
	"jeton_rafraichissement_expire_le" timestamp with time zone,
	"portee" text,
	"mot_de_passe" text,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"mis_a_jour_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"utilisateur_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	"adresse_ip" text,
	"agent_utilisateur" text,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"mis_a_jour_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "utilisateur" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"email" text NOT NULL,
	"email_verifie" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "role_utilisateur" NOT NULL,
	"entite_id" uuid,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"mis_a_jour_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "utilisateur_email_unique" UNIQUE("email"),
	CONSTRAINT "utilisateur_rattachement_selon_role" CHECK (("utilisateur"."role" in ('admin', 'direction', 'lead', 'membre') and "utilisateur"."entite_id" is null)
        or ("utilisateur"."role" in ('referent_client', 'lecteur_client') and "utilisateur"."entite_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifiant" text NOT NULL,
	"valeur" text NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"mis_a_jour_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "actif" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entite_id" uuid NOT NULL,
	"type" "type_actif" NOT NULL,
	"libelle" text NOT NULL,
	"identifiant" text NOT NULL,
	"fournisseur" text NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"mis_a_jour_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "actif_id_entite" UNIQUE("id","entite_id")
);
--> statement-breakpoint
CREATE TABLE "entite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"slug" text NOT NULL,
	"secteur" text NOT NULL,
	"couleur_marque" text NOT NULL,
	"logo_url" text,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"mis_a_jour_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entite_slug_unique" UNIQUE("slug"),
	CONSTRAINT "entite_couleur_marque_hex" CHECK ("entite"."couleur_marque" ~ '^#[0-9A-Fa-f]{6}$')
);
--> statement-breakpoint
CREATE TABLE "suivi_entite" (
	"utilisateur_id" uuid NOT NULL,
	"entite_id" uuid NOT NULL,
	"role" "role_suivi" NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"mis_a_jour_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suivi_entite_utilisateur_id_entite_id_pk" PRIMARY KEY("utilisateur_id","entite_id")
);
--> statement-breakpoint
CREATE TABLE "affectation_projet" (
	"projet_id" uuid NOT NULL,
	"utilisateur_id" uuid NOT NULL,
	"entite_id" uuid NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"mis_a_jour_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "affectation_projet_projet_id_utilisateur_id_pk" PRIMARY KEY("projet_id","utilisateur_id")
);
--> statement-breakpoint
CREATE TABLE "demande" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entite_id" uuid NOT NULL,
	"type" "type_demande" NOT NULL,
	"titre" text NOT NULL,
	"brief" text NOT NULL,
	"urgence" "urgence_demande" NOT NULL,
	"statut" "statut_demande" NOT NULL,
	"echeance" date,
	"auteur_id" uuid NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"mis_a_jour_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "demande_id_entite" UNIQUE("id","entite_id")
);
--> statement-breakpoint
CREATE TABLE "jalon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entite_id" uuid NOT NULL,
	"projet_id" uuid NOT NULL,
	"titre" text NOT NULL,
	"echeance" date NOT NULL,
	"statut" "statut_jalon" NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"mis_a_jour_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jalon_id_entite" UNIQUE("id","entite_id")
);
--> statement-breakpoint
CREATE TABLE "projet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entite_id" uuid NOT NULL,
	"demande_id" uuid,
	"nom" text NOT NULL,
	"description" text NOT NULL,
	"responsable_id" uuid NOT NULL,
	"statut" "statut_projet" NOT NULL,
	"date_debut" date NOT NULL,
	"date_fin_prevue" date NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"mis_a_jour_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projet_id_entite" UNIQUE("id","entite_id")
);
--> statement-breakpoint
CREATE TABLE "tache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entite_id" uuid NOT NULL,
	"projet_id" uuid NOT NULL,
	"jalon_id" uuid,
	"titre" text NOT NULL,
	"responsable_id" uuid,
	"equipe" "equipe_tache" NOT NULL,
	"statut" "statut_tache" NOT NULL,
	"echeance" date,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"mis_a_jour_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tache_id_entite" UNIQUE("id","entite_id")
);
--> statement-breakpoint
CREATE TABLE "tache_dependance" (
	"tache_id" uuid NOT NULL,
	"depend_de_id" uuid NOT NULL,
	"entite_id" uuid NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"mis_a_jour_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tache_dependance_tache_id_depend_de_id_pk" PRIMARY KEY("tache_id","depend_de_id"),
	CONSTRAINT "tache_dependance_distincte" CHECK ("tache_dependance"."tache_id" <> "tache_dependance"."depend_de_id")
);
--> statement-breakpoint
CREATE TABLE "journal_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entite_id" uuid,
	"acteur_id" uuid,
	"action" text NOT NULL,
	"cible_type" text NOT NULL,
	"cible_id" uuid,
	"horodatage" timestamp with time zone DEFAULT now() NOT NULL,
	"etat_avant" jsonb
);
--> statement-breakpoint
CREATE TABLE "mesure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entite_id" uuid NOT NULL,
	"source" "source_mesure" NOT NULL,
	"cle_metrique" text NOT NULL,
	"dimension" text DEFAULT 'total' NOT NULL,
	"date" date NOT NULL,
	"valeur" numeric(18, 4) NOT NULL,
	"collecte_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mesure_unique_par_jour" UNIQUE("entite_id","source","cle_metrique","dimension","date")
);
--> statement-breakpoint
CREATE TABLE "publication" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entite_id" uuid NOT NULL,
	"actif_id" uuid NOT NULL,
	"reseau" "reseau_social" NOT NULL,
	"contenu" text NOT NULL,
	"programmee_le" timestamp with time zone NOT NULL,
	"statut" "statut_publication" NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"mis_a_jour_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_payload" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entite_id" uuid NOT NULL,
	"source" text NOT NULL,
	"endpoint" text NOT NULL,
	"collecte_le" timestamp with time zone DEFAULT now() NOT NULL,
	"charge" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "compte" ADD CONSTRAINT "compte_utilisateur_id_utilisateur_id_fk" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateur"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_utilisateur_id_utilisateur_id_fk" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateur"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utilisateur" ADD CONSTRAINT "utilisateur_entite_id_entite_id_fk" FOREIGN KEY ("entite_id") REFERENCES "public"."entite"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actif" ADD CONSTRAINT "actif_entite_id_entite_id_fk" FOREIGN KEY ("entite_id") REFERENCES "public"."entite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suivi_entite" ADD CONSTRAINT "suivi_entite_utilisateur_id_utilisateur_id_fk" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateur"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suivi_entite" ADD CONSTRAINT "suivi_entite_entite_id_entite_id_fk" FOREIGN KEY ("entite_id") REFERENCES "public"."entite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affectation_projet" ADD CONSTRAINT "affectation_projet_utilisateur_id_utilisateur_id_fk" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateur"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affectation_projet" ADD CONSTRAINT "affectation_projet_entite_id_entite_id_fk" FOREIGN KEY ("entite_id") REFERENCES "public"."entite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affectation_projet" ADD CONSTRAINT "affectation_projet_projet_fk" FOREIGN KEY ("projet_id","entite_id") REFERENCES "public"."projet"("id","entite_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demande" ADD CONSTRAINT "demande_entite_id_entite_id_fk" FOREIGN KEY ("entite_id") REFERENCES "public"."entite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demande" ADD CONSTRAINT "demande_auteur_id_utilisateur_id_fk" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jalon" ADD CONSTRAINT "jalon_entite_id_entite_id_fk" FOREIGN KEY ("entite_id") REFERENCES "public"."entite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jalon" ADD CONSTRAINT "jalon_projet_fk" FOREIGN KEY ("projet_id","entite_id") REFERENCES "public"."projet"("id","entite_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projet" ADD CONSTRAINT "projet_entite_id_entite_id_fk" FOREIGN KEY ("entite_id") REFERENCES "public"."entite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projet" ADD CONSTRAINT "projet_responsable_id_utilisateur_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."utilisateur"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projet" ADD CONSTRAINT "projet_demande_fk" FOREIGN KEY ("demande_id","entite_id") REFERENCES "public"."demande"("id","entite_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tache" ADD CONSTRAINT "tache_entite_id_entite_id_fk" FOREIGN KEY ("entite_id") REFERENCES "public"."entite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tache" ADD CONSTRAINT "tache_responsable_id_utilisateur_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."utilisateur"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tache" ADD CONSTRAINT "tache_projet_fk" FOREIGN KEY ("projet_id","entite_id") REFERENCES "public"."projet"("id","entite_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tache" ADD CONSTRAINT "tache_jalon_fk" FOREIGN KEY ("jalon_id","entite_id") REFERENCES "public"."jalon"("id","entite_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tache_dependance" ADD CONSTRAINT "tache_dependance_entite_id_entite_id_fk" FOREIGN KEY ("entite_id") REFERENCES "public"."entite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tache_dependance" ADD CONSTRAINT "tache_dependance_tache_fk" FOREIGN KEY ("tache_id","entite_id") REFERENCES "public"."tache"("id","entite_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tache_dependance" ADD CONSTRAINT "tache_dependance_depend_de_fk" FOREIGN KEY ("depend_de_id","entite_id") REFERENCES "public"."tache"("id","entite_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_audit" ADD CONSTRAINT "journal_audit_entite_id_entite_id_fk" FOREIGN KEY ("entite_id") REFERENCES "public"."entite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_audit" ADD CONSTRAINT "journal_audit_acteur_id_utilisateur_id_fk" FOREIGN KEY ("acteur_id") REFERENCES "public"."utilisateur"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mesure" ADD CONSTRAINT "mesure_entite_id_entite_id_fk" FOREIGN KEY ("entite_id") REFERENCES "public"."entite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication" ADD CONSTRAINT "publication_entite_id_entite_id_fk" FOREIGN KEY ("entite_id") REFERENCES "public"."entite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication" ADD CONSTRAINT "publication_actif_fk" FOREIGN KEY ("actif_id","entite_id") REFERENCES "public"."actif"("id","entite_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_payload" ADD CONSTRAINT "raw_payload_entite_id_entite_id_fk" FOREIGN KEY ("entite_id") REFERENCES "public"."entite"("id") ON DELETE cascade ON UPDATE no action;