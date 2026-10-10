import { ROLES } from "@hilaac/core";
import { pgEnum } from "drizzle-orm/pg-core";

export const roleUtilisateur = pgEnum("role_utilisateur", ROLES);
export const roleSuivi = pgEnum("role_suivi", ["referent", "contributeur"]);
export const typeActif = pgEnum("type_actif", [
  "site",
  "domaine",
  "hebergement",
  "compte_social",
  "compte_mesure",
]);
export const typeDemande = pgEnum("type_demande", [
  "site_web",
  "contenu_social",
  "campagne",
  "seo",
  "maintenance",
  "autre",
]);
export const urgenceDemande = pgEnum("urgence_demande", [
  "basse",
  "normale",
  "haute",
  "critique",
]);
export const statutDemande = pgEnum("statut_demande", [
  "a_qualifier",
  "qualifiee",
  "en_cours",
  "en_attente_validation",
  "terminee",
  "refusee",
]);
export const statutProjet = pgEnum("statut_projet", [
  "planifie",
  "en_cours",
  "en_pause",
  "termine",
]);
export const statutJalon = pgEnum("statut_jalon", [
  "a_venir",
  "en_cours",
  "atteint",
]);
export const statutTache = pgEnum("statut_tache", [
  "a_faire",
  "en_cours",
  "en_revue",
  "bloquee",
  "terminee",
]);
export const equipeTache = pgEnum("equipe_tache", [
  "dev",
  "graphisme",
  "redaction",
  "photo_video",
  "marketing",
]);
export const reseauSocial = pgEnum("reseau_social", ["facebook", "linkedin"]);
export const statutPublication = pgEnum("statut_publication", [
  "brouillon",
  "en_validation",
  "programmee",
  "publiee",
  "echec",
]);
export const sourceMesure = pgEnum("source_mesure", [
  "ga4",
  "facebook",
  "linkedin",
  "formulaire_site",
]);
