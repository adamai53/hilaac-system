import type { Role } from "@hilaac/core";

// Libellés d'affichage des valeurs stockées en base.

export const LIBELLE_ROLE: Record<Role, string> = {
  admin: "Administrateur",
  direction: "Direction",
  lead: "Lead",
  membre: "Membre de l'équipe",
  referent_client: "Référent",
  lecteur_client: "Lecteur",
};

export const LIBELLE_STATUT_DEMANDE: Record<string, string> = {
  a_qualifier: "À qualifier",
  qualifiee: "Qualifiée",
  en_cours: "En cours",
  en_attente_validation: "En attente de validation",
  terminee: "Terminée",
  refusee: "Refusée",
};

export const LIBELLE_TYPE_DEMANDE: Record<string, string> = {
  site_web: "Site web",
  contenu_social: "Contenu social",
  campagne: "Campagne",
  seo: "SEO",
  maintenance: "Maintenance",
  autre: "Autre",
};

export const LIBELLE_URGENCE: Record<string, string> = {
  basse: "Basse",
  normale: "Normale",
  haute: "Haute",
  critique: "Critique",
};

export const LIBELLE_STATUT_TACHE: Record<string, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  en_revue: "En revue",
  bloquee: "Bloquée",
  terminee: "Terminée",
};

export const LIBELLE_EQUIPE: Record<string, string> = {
  dev: "Dev",
  graphisme: "Graphisme",
  redaction: "Rédaction",
  photo_video: "Photo / vidéo",
  marketing: "Marketing",
};

export const LIBELLE_STATUT_JALON: Record<string, string> = {
  a_venir: "À venir",
  en_cours: "En cours",
  atteint: "Atteint",
};

export const LIBELLE_TYPE_ACTIF: Record<string, string> = {
  site: "Site",
  domaine: "Domaine",
  hebergement: "Hébergement",
  compte_social: "Compte social",
  compte_mesure: "Compte de mesure",
};

export const LIBELLE_RESEAU: Record<string, string> = {
  facebook: "Facebook",
  linkedin: "LinkedIn",
};

export const LIBELLE_STATUT_PUBLICATION: Record<string, string> = {
  brouillon: "Brouillon",
  en_validation: "En validation",
  programmee: "Programmée",
  publiee: "Publiée",
  echec: "Échec",
};
