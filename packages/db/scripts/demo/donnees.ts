import { createHash } from "node:crypto";
import type {
  actif,
  affectationProjet,
  demande,
  entite,
  jalon,
  mesure,
  projet,
  publication,
  suiviEntite,
  tache,
  tacheDependance,
  utilisateur,
} from "../../src/schema";

// Jeu de données de démonstration : entités, personnes et chiffres entièrement fictifs.

export const MOT_DE_PASSE_DEMO = "Demo-Hilaac-2026";

const ESPACE_UUID = Buffer.from("6f1c1d1e8a3b4b7a9d552f0b7c3e4a10", "hex");

/** UUID v5 (RFC 9562) : le même nom donne toujours le même identifiant. */
export function idDemo(nom: string): string {
  const hash = createHash("sha1")
    .update(ESPACE_UUID)
    .update(nom)
    .digest()
    .subarray(0, 16);
  hash.writeUInt8((hash.readUInt8(6) & 0x0f) | 0x50, 6);
  hash.writeUInt8((hash.readUInt8(8) & 0x3f) | 0x80, 8);
  const h = hash.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Nombre pseudo-aléatoire déterministe dans [0, 1[. */
function alea(cle: string): number {
  return createHash("sha1").update(cle).digest().readUInt32BE(0) / 2 ** 32;
}

type CleEntite = "kelvane" | "sablon" | "orvia";
type CleCompte =
  | "admin"
  | "direction"
  | "lead"
  | "membre1"
  | "membre2"
  | "referent-kelvane"
  | "referent-sablon"
  | "lecteur-orvia";

interface ModeleEntite {
  cle: CleEntite;
  nom: string;
  secteur: string;
  couleur: string;
  domaine: string;
  secondSite: { libelle: string; sousDomaine: string };
  /** Membre de l'équipe affecté au projet de l'entité. */
  membre: CleCompte;
  auteurDemandes: CleCompte;
  projet: { nom: string; description: string; module: string };
  demandes: {
    type: (typeof demande.type.enumValues)[number];
    titre: string;
    brief: string;
    urgence: (typeof demande.urgence.enumValues)[number];
    statut: (typeof demande.statut.enumValues)[number];
    echeance: number | null;
  }[];
  publications: string[];
  trafic: {
    sessions: number;
    croissance: number;
    weekEnd: number;
    conversion: number;
  };
}

export const ENTITES: ModeleEntite[] = [
  {
    cle: "kelvane",
    nom: "Kelvane Logistique",
    secteur: "Transport et logistique",
    couleur: "#0E7490",
    domaine: "kelvane-logistique.test",
    secondSite: { libelle: "Espace recrutement", sousDomaine: "recrutement" },
    membre: "membre1",
    auteurDemandes: "referent-kelvane",
    projet: {
      nom: "Refonte du site institutionnel",
      description: "Nouveau site vitrine, pages agences et suivi d'expédition.",
      module: "Module de suivi d'expédition",
    },
    demandes: [
      {
        type: "site_web",
        titre: "Page de suivi des expéditions",
        brief:
          "Permettre aux clients de suivre un colis à partir de son numéro.",
        urgence: "haute",
        statut: "a_qualifier",
        echeance: 21,
      },
      {
        type: "contenu_social",
        titre: "Série LinkedIn sur la flotte électrique",
        brief: "Quatre posts présentant les nouveaux porteurs électriques.",
        urgence: "normale",
        statut: "a_qualifier",
        echeance: 30,
      },
      {
        type: "seo",
        titre: "Audit SEO des pages agences",
        brief: "Vérifier l'indexation et les fiches locales des huit agences.",
        urgence: "normale",
        statut: "qualifiee",
        echeance: 40,
      },
      {
        type: "site_web",
        titre: "Refonte du site institutionnel",
        brief: "Moderniser le site et intégrer le suivi d'expédition.",
        urgence: "haute",
        statut: "en_cours",
        echeance: 35,
      },
      {
        type: "campagne",
        titre: "Campagne de recrutement chauffeurs",
        brief: "Campagne Facebook ciblée sur trois régions.",
        urgence: "haute",
        statut: "en_cours",
        echeance: 14,
      },
      {
        type: "contenu_social",
        titre: "Visuels du salon Transport Expo",
        brief: "Bannières et posts pour le stand.",
        urgence: "normale",
        statut: "en_attente_validation",
        echeance: 5,
      },
      {
        type: "maintenance",
        titre: "Mise à jour des extensions WordPress",
        brief: "Mises à jour de sécurité trimestrielles.",
        urgence: "basse",
        statut: "terminee",
        echeance: -10,
      },
      {
        type: "autre",
        titre: "Traduction anglaise de la plaquette",
        brief: "Version anglaise de la plaquette commerciale.",
        urgence: "basse",
        statut: "refusee",
        echeance: null,
      },
    ],
    publications: [
      "Nos porteurs électriques couvrent désormais toute la zone portuaire.",
      "Kelvane recrute 12 chauffeurs poids lourd : rejoignez une équipe qui roule.",
      "Retour en images sur l'inauguration de la plateforme nord.",
      "Délais de livraison : nos engagements pour la fin d'année.",
      "Rencontrez nos équipes au salon Transport Expo, stand B12.",
      "Trois questions à notre responsable sécurité routière.",
      "Nouveau : suivez vos expéditions en temps réel.",
      "Bilan carbone : où en sommes-nous un an après ?",
    ],
    trafic: {
      sessions: 420,
      croissance: 0.25,
      weekEnd: 0.55,
      conversion: 0.014,
    },
  },
  {
    cle: "sablon",
    nom: "Hôtels Sablon",
    secteur: "Hôtellerie",
    couleur: "#B45309",
    domaine: "hotels-sablon.test",
    secondSite: { libelle: "Site de réservation", sousDomaine: "reservation" },
    membre: "membre1",
    auteurDemandes: "referent-sablon",
    projet: {
      nom: "Moteur de réservation directe",
      description:
        "Réservation sans intermédiaire, offres et paiement en ligne.",
      module: "Module d'offres saisonnières",
    },
    demandes: [
      {
        type: "campagne",
        titre: "Offre week-end de printemps",
        brief: "Campagne Facebook et page dédiée pour l'offre deux nuits.",
        urgence: "haute",
        statut: "a_qualifier",
        echeance: 18,
      },
      {
        type: "site_web",
        titre: "Galerie photo des nouvelles suites",
        brief: "Intégrer les vingt nouvelles photos des suites rénovées.",
        urgence: "normale",
        statut: "a_qualifier",
        echeance: 25,
      },
      {
        type: "site_web",
        titre: "Moteur de réservation directe",
        brief: "Réduire la dépendance aux plateformes de réservation.",
        urgence: "critique",
        statut: "en_cours",
        echeance: 35,
      },
      {
        type: "contenu_social",
        titre: "Calendrier éditorial de l'été",
        brief: "Programmation des posts juin à août.",
        urgence: "normale",
        statut: "en_cours",
        echeance: 20,
      },
      {
        type: "seo",
        titre: "Optimisation des pages séminaires",
        brief: "Positionner l'offre séminaires sur les requêtes locales.",
        urgence: "normale",
        statut: "qualifiee",
        echeance: 45,
      },
      {
        type: "contenu_social",
        titre: "Vidéo de présentation du spa",
        brief: "Montage court pour Facebook et LinkedIn.",
        urgence: "normale",
        statut: "en_attente_validation",
        echeance: 4,
      },
      {
        type: "campagne",
        titre: "Newsletter de rentrée",
        brief: "Mise en avant des offres d'automne.",
        urgence: "basse",
        statut: "en_attente_validation",
        echeance: 9,
      },
      {
        type: "maintenance",
        titre: "Renouvellement du certificat SSL",
        brief: "Certificat du site de réservation.",
        urgence: "haute",
        statut: "terminee",
        echeance: -15,
      },
      {
        type: "autre",
        titre: "Application mobile dédiée",
        brief: "Étude d'une application de réservation.",
        urgence: "basse",
        statut: "refusee",
        echeance: null,
      },
    ],
    publications: [
      "Les suites rénovées vous attendent : découvrez-les en avant-première.",
      "Séminaires : nos salles accueillent jusqu'à 120 personnes.",
      "Le chef dévoile la carte d'automne du restaurant.",
      "Offre week-end : la deuxième nuit à moitié prix.",
      "Hôtels Sablon recrute pour la saison : réception, cuisine, spa.",
      "Notre spa fait peau neuve, réouverture le mois prochain.",
      "Réservez en direct et profitez du petit-déjeuner offert.",
      "Coulisses : une journée avec l'équipe d'étage.",
    ],
    trafic: {
      sessions: 760,
      croissance: 0.35,
      weekEnd: 1.2,
      conversion: 0.019,
    },
  },
  {
    cle: "orvia",
    nom: "Clinique Orvia",
    secteur: "Santé privée",
    couleur: "#7C3AED",
    domaine: "clinique-orvia.test",
    secondSite: { libelle: "Blog santé", sousDomaine: "blog" },
    membre: "membre2",
    auteurDemandes: "lead",
    projet: {
      nom: "Prise de rendez-vous en ligne",
      description: "Parcours de prise de rendez-vous et fiches praticiens.",
      module: "Module d'agenda des praticiens",
    },
    demandes: [
      {
        type: "site_web",
        titre: "Fiches praticiens",
        brief: "Une fiche par praticien avec spécialités et horaires.",
        urgence: "haute",
        statut: "a_qualifier",
        echeance: 28,
      },
      {
        type: "seo",
        titre: "Pages spécialités",
        brief: "Contenus de référence pour les six spécialités.",
        urgence: "normale",
        statut: "qualifiee",
        echeance: 50,
      },
      {
        type: "site_web",
        titre: "Prise de rendez-vous en ligne",
        brief: "Réduire les appels au standard.",
        urgence: "haute",
        statut: "en_cours",
        echeance: 35,
      },
      {
        type: "contenu_social",
        titre: "Campagne prévention hivernale",
        brief: "Série de posts sur la vaccination.",
        urgence: "normale",
        statut: "en_cours",
        echeance: 16,
      },
      {
        type: "contenu_social",
        titre: "Portraits de l'équipe soignante",
        brief: "Six portraits pour LinkedIn.",
        urgence: "basse",
        statut: "en_attente_validation",
        echeance: 7,
      },
      {
        type: "maintenance",
        titre: "Sauvegardes du site",
        brief: "Mise en place des sauvegardes quotidiennes.",
        urgence: "normale",
        statut: "terminee",
        echeance: -20,
      },
      {
        type: "autre",
        titre: "Borne d'accueil interactive",
        brief: "Étude d'une borne dans le hall.",
        urgence: "basse",
        statut: "refusee",
        echeance: null,
      },
    ],
    publications: [
      "Prenez rendez-vous en ligne, 24 heures sur 24.",
      "Vaccination antigrippale : les créneaux sont ouverts.",
      "Bienvenue au docteur Nadia Ferhat, cardiologue.",
      "Nos conseils pour bien préparer une consultation.",
      "La clinique s'équipe d'un nouvel IRM.",
      "Journée portes ouvertes du service de pédiatrie.",
      "Portrait : l'équipe du bloc opératoire.",
      "Dépistage : pourquoi ne pas attendre.",
    ],
    trafic: {
      sessions: 310,
      croissance: 0.18,
      weekEnd: 0.6,
      conversion: 0.022,
    },
  },
];

export const COMPTES: {
  cle: CleCompte;
  nom: string;
  email: string;
  role: (typeof utilisateur.role.enumValues)[number];
  entite?: CleEntite;
}[] = [
  {
    cle: "admin",
    nom: "Samir Haddad",
    email: "admin@hilaac.test",
    role: "admin",
  },
  {
    cle: "direction",
    nom: "Claire Moreau",
    email: "direction@hilaac.test",
    role: "direction",
  },
  { cle: "lead", nom: "Yacine Bouri", email: "lead@hilaac.test", role: "lead" },
  {
    cle: "membre1",
    nom: "Léa Martin",
    email: "lea.martin@hilaac.test",
    role: "membre",
  },
  {
    cle: "membre2",
    nom: "Omar Saïd",
    email: "omar.said@hilaac.test",
    role: "membre",
  },
  {
    cle: "referent-kelvane",
    nom: "Marc Dubois",
    email: "referent@kelvane-logistique.test",
    role: "referent_client",
    entite: "kelvane",
  },
  {
    cle: "referent-sablon",
    nom: "Sophie Laurent",
    email: "referent@hotels-sablon.test",
    role: "referent_client",
    entite: "sablon",
  },
  {
    cle: "lecteur-orvia",
    nom: "Hugo Petit",
    email: "lecteur@clinique-orvia.test",
    role: "lecteur_client",
    entite: "orvia",
  },
];

const JALONS: {
  titre: string;
  echeance: number;
  statut: (typeof jalon.statut.enumValues)[number];
}[] = [
  { titre: "Cadrage validé", echeance: -20, statut: "atteint" },
  { titre: "Maquettes validées", echeance: 3, statut: "en_cours" },
  { titre: "Contenus livrés", echeance: -2, statut: "en_cours" },
  { titre: "Mise en ligne", echeance: 36, statut: "a_venir" },
];

/** M : membre affecté au projet, L : lead. Les dépendances visent l'index d'une autre tâche. */
const TACHES: {
  titre: string | ((m: ModeleEntite) => string);
  echeance: number;
  statut: (typeof tache.statut.enumValues)[number];
  equipe: (typeof tache.equipe.enumValues)[number];
  jalon: number;
  responsable: "L" | "M";
  dependDe?: number[];
}[] = [
  {
    titre: "Atelier de cadrage",
    echeance: -25,
    statut: "terminee",
    equipe: "marketing",
    jalon: 0,
    responsable: "L",
  },
  {
    titre: "Arborescence et parcours",
    echeance: -18,
    statut: "terminee",
    equipe: "dev",
    jalon: 0,
    responsable: "M",
  },
  {
    titre: "Maquettes desktop",
    echeance: 0,
    statut: "en_cours",
    equipe: "graphisme",
    jalon: 1,
    responsable: "M",
  },
  {
    titre: "Maquettes mobile",
    echeance: 2,
    statut: "a_faire",
    equipe: "graphisme",
    jalon: 1,
    responsable: "M",
    dependDe: [2],
  },
  {
    titre: "Rédaction des contenus",
    echeance: -3,
    statut: "en_cours",
    equipe: "redaction",
    jalon: 2,
    responsable: "L",
  },
  {
    titre: "Shooting photo",
    echeance: -1,
    statut: "a_faire",
    equipe: "photo_video",
    jalon: 2,
    responsable: "M",
  },
  {
    titre: "Point d'étape avec le client",
    echeance: 0,
    statut: "a_faire",
    equipe: "marketing",
    jalon: 1,
    responsable: "L",
  },
  {
    titre: "Intégration du thème",
    echeance: 12,
    statut: "a_faire",
    equipe: "dev",
    jalon: 3,
    responsable: "M",
    dependDe: [2, 3],
  },
  {
    titre: (m) => m.projet.module,
    echeance: 18,
    statut: "a_faire",
    equipe: "dev",
    jalon: 3,
    responsable: "L",
  },
  {
    titre: "Optimisation SEO technique",
    echeance: 25,
    statut: "a_faire",
    equipe: "marketing",
    jalon: 3,
    responsable: "M",
  },
  {
    titre: "Recette fonctionnelle",
    echeance: 30,
    statut: "a_faire",
    equipe: "dev",
    jalon: 3,
    responsable: "L",
    dependDe: [7, 8],
  },
  {
    titre: "Campagne de lancement",
    echeance: 33,
    statut: "a_faire",
    equipe: "marketing",
    jalon: 3,
    responsable: "L",
  },
  {
    titre: "Mise en production",
    echeance: 36,
    statut: "a_faire",
    equipe: "dev",
    jalon: 3,
    responsable: "L",
    dependDe: [10],
  },
];

const PUBLICATIONS: {
  decalage: number;
  statut: (typeof publication.statut.enumValues)[number];
}[] = [
  { decalage: -27, statut: "publiee" },
  { decalage: -20, statut: "publiee" },
  { decalage: -13, statut: "publiee" },
  { decalage: -8, statut: "publiee" },
  { decalage: -3, statut: "publiee" },
  { decalage: 2, statut: "en_validation" },
  { decalage: 6, statut: "programmee" },
  { decalage: 12, statut: "brouillon" },
];

export const JOURS_DE_MESURES = 60;

/** Jour calendaire UTC, décalé de `decalage` jours par rapport à `aujourdhui`. */
function jour(aujourdhui: Date, decalage: number): string {
  const d = new Date(
    Date.UTC(
      aujourdhui.getUTCFullYear(),
      aujourdhui.getUTCMonth(),
      aujourdhui.getUTCDate(),
    ),
  );
  d.setUTCDate(d.getUTCDate() + decalage);
  return d.toISOString().slice(0, 10);
}

function instant(aujourdhui: Date, decalage: number, heure: string): Date {
  return new Date(`${jour(aujourdhui, decalage)}T${heure}:00Z`);
}

export function construireDonneesDemo(aujourdhui: Date) {
  const horodatage = {
    creeLe: instant(aujourdhui, -30, "08:00"),
    misAJourLe: instant(aujourdhui, -30, "08:00"),
  };
  const idCompte = (cle: CleCompte) => idDemo(`utilisateur:${cle}`);
  const idEntite = (cle: CleEntite) => idDemo(`entite:${cle}`);

  const entites: (typeof entite.$inferInsert)[] = ENTITES.map((m) => ({
    id: idEntite(m.cle),
    nom: m.nom,
    slug: m.cle,
    secteur: m.secteur,
    couleurMarque: m.couleur,
    logoUrl: null,
    ...horodatage,
  }));

  const utilisateurs: (typeof utilisateur.$inferInsert)[] = COMPTES.map(
    (c) => ({
      id: idCompte(c.cle),
      nom: c.nom,
      email: c.email,
      emailVerifie: true,
      image: null,
      role: c.role,
      entiteId: c.entite ? idEntite(c.entite) : null,
      ...horodatage,
    }),
  );

  // Chaque membre de l'équipe suit les trois entités ; la restriction existe mais n'est pas exploitée.
  const suivis: (typeof suiviEntite.$inferInsert)[] = ENTITES.flatMap((m) =>
    (["lead", "membre1", "membre2"] as const).map((cle) => ({
      utilisateurId: idCompte(cle),
      entiteId: idEntite(m.cle),
      role: cle === "lead" ? ("referent" as const) : ("contributeur" as const),
      ...horodatage,
    })),
  );

  const actifs: (typeof actif.$inferInsert)[] = [];
  const demandes: (typeof demande.$inferInsert)[] = [];
  const projets: (typeof projet.$inferInsert)[] = [];
  const affectations: (typeof affectationProjet.$inferInsert)[] = [];
  const jalons: (typeof jalon.$inferInsert)[] = [];
  const taches: (typeof tache.$inferInsert)[] = [];
  const dependances: (typeof tacheDependance.$inferInsert)[] = [];
  const publications: (typeof publication.$inferInsert)[] = [];
  const mesures: (typeof mesure.$inferInsert)[] = [];

  for (const m of ENTITES) {
    const entiteId = idEntite(m.cle);
    const id = (nom: string) => idDemo(`${m.cle}:${nom}`);

    const sites = [
      {
        cle: "site-principal",
        libelle: "Site institutionnel",
        url: `https://www.${m.domaine}`,
      },
      {
        cle: "site-secondaire",
        libelle: m.secondSite.libelle,
        url: `https://${m.secondSite.sousDomaine}.${m.domaine}`,
      },
    ];
    for (const site of sites) {
      actifs.push({
        id: id(`actif:${site.cle}`),
        entiteId,
        type: "site",
        libelle: site.libelle,
        identifiant: site.url,
        fournisseur: "WordPress",
        ...horodatage,
      });
    }
    const facebook = id("actif:facebook");
    const linkedin = id("actif:linkedin");
    actifs.push(
      {
        id: facebook,
        entiteId,
        type: "compte_social",
        libelle: "Page Facebook",
        identifiant: `facebook.com/${m.cle}.demo`,
        fournisseur: "Facebook",
        ...horodatage,
      },
      {
        id: linkedin,
        entiteId,
        type: "compte_social",
        libelle: "Page LinkedIn",
        identifiant: `linkedin.com/company/${m.cle}-demo`,
        fournisseur: "LinkedIn",
        ...horodatage,
      },
    );

    m.demandes.forEach((d, i) => {
      demandes.push({
        id: id(`demande:${i}`),
        entiteId,
        type: d.type,
        titre: d.titre,
        brief: d.brief,
        urgence: d.urgence,
        statut: d.statut,
        echeance: d.echeance === null ? null : jour(aujourdhui, d.echeance),
        auteurId: idCompte(m.auteurDemandes),
        creeLe: instant(aujourdhui, -40 + i * 4, "09:30"),
        misAJourLe: horodatage.misAJourLe,
      });
    });

    const projetId = id("projet");
    const demandeProjet = m.demandes.findIndex((d) => d.titre === m.projet.nom);
    projets.push({
      id: projetId,
      entiteId,
      demandeId: demandeProjet >= 0 ? id(`demande:${demandeProjet}`) : null,
      nom: m.projet.nom,
      description: m.projet.description,
      responsableId: idCompte("lead"),
      statut: "en_cours",
      dateDebut: jour(aujourdhui, -30),
      dateFinPrevue: jour(aujourdhui, 36),
      ...horodatage,
    });
    for (const cle of ["lead", m.membre] as const) {
      affectations.push({
        projetId,
        utilisateurId: idCompte(cle),
        entiteId,
        ...horodatage,
      });
    }

    JALONS.forEach((j, i) => {
      jalons.push({
        id: id(`jalon:${i}`),
        entiteId,
        projetId,
        titre: j.titre,
        echeance: jour(aujourdhui, j.echeance),
        statut: j.statut,
        ...horodatage,
      });
    });

    TACHES.forEach((t, i) => {
      taches.push({
        id: id(`tache:${i}`),
        entiteId,
        projetId,
        jalonId: id(`jalon:${t.jalon}`),
        titre: typeof t.titre === "string" ? t.titre : t.titre(m),
        responsableId: idCompte(t.responsable === "L" ? "lead" : m.membre),
        equipe: t.equipe,
        statut: t.statut,
        echeance: jour(aujourdhui, t.echeance),
        ...horodatage,
      });
      for (const amont of t.dependDe ?? []) {
        dependances.push({
          tacheId: id(`tache:${i}`),
          dependDeId: id(`tache:${amont}`),
          entiteId,
          ...horodatage,
        });
      }
    });

    m.publications.forEach((contenu, i) => {
      const p = PUBLICATIONS[i];
      if (!p) return;
      const publicationId = id(`publication:${i}`);
      const reseau =
        i % 2 === 0 ? ("facebook" as const) : ("linkedin" as const);
      publications.push({
        id: publicationId,
        entiteId,
        actifId: reseau === "facebook" ? facebook : linkedin,
        reseau,
        contenu,
        programmeeLe: instant(aujourdhui, p.decalage, "10:00"),
        statut: p.statut,
        ...horodatage,
      });
      if (p.statut === "publiee") {
        const date = jour(aujourdhui, p.decalage);
        mesures.push({
          id: idDemo(
            `mesure:${entiteId}:${reseau}:engagement:publication:${publicationId}:${date}`,
          ),
          entiteId,
          source: reseau,
          cleMetrique: "engagement",
          dimension: `publication:${publicationId}`,
          date,
          valeur: Math.round(60 + alea(`${publicationId}:${date}`) * 240),
          collecteLe: instant(aujourdhui, p.decalage + 1, "02:00"),
        });
      }
    });

    for (let decalage = -(JOURS_DE_MESURES - 1); decalage <= 0; decalage++) {
      const date = jour(aujourdhui, decalage);
      const progression =
        (decalage + JOURS_DE_MESURES - 1) / (JOURS_DE_MESURES - 1);
      const jourSemaine = new Date(`${date}T00:00:00Z`).getUTCDay();
      const saison =
        jourSemaine === 0 || jourSemaine === 6 ? m.trafic.weekEnd : 1;
      const bruit = (cle: string) =>
        0.88 + alea(`${m.cle}:${cle}:${date}`) * 0.24;
      const sessions = Math.round(
        m.trafic.sessions *
          (1 + m.trafic.croissance * progression) *
          saison *
          bruit("sessions"),
      );
      const valeurs: [
        (typeof mesure.source.enumValues)[number],
        string,
        number,
      ][] = [
        ["ga4", "sessions", sessions],
        [
          "facebook",
          "impressions",
          Math.round(sessions * 2.8 * bruit("fb-impressions")),
        ],
        [
          "linkedin",
          "impressions",
          Math.round(sessions * 1.4 * bruit("li-impressions")),
        ],
        [
          "facebook",
          "engagement",
          Math.round(sessions * 2.8 * 0.045 * bruit("fb-engagement")),
        ],
        [
          "linkedin",
          "engagement",
          Math.round(sessions * 1.4 * 0.03 * bruit("li-engagement")),
        ],
        [
          "formulaire_site",
          "leads",
          Math.round(sessions * m.trafic.conversion * bruit("leads")),
        ],
      ];
      for (const [source, cleMetrique, valeur] of valeurs) {
        mesures.push({
          id: idDemo(
            `mesure:${entiteId}:${source}:${cleMetrique}:total:${date}`,
          ),
          entiteId,
          source,
          cleMetrique,
          dimension: "total",
          date,
          valeur,
          collecteLe: instant(aujourdhui, decalage + 1, "02:00"),
        });
      }
    }
  }

  // Tâche confiée à un membre non affecté au projet : il la voit, sans voir le projet.
  const kelvane = idEntite("kelvane");
  taches.push({
    id: idDemo("kelvane:tache:video-flotte"),
    entiteId: kelvane,
    projetId: idDemo("kelvane:projet"),
    jalonId: idDemo("kelvane:jalon:2"),
    titre: "Vidéo de la flotte électrique",
    responsableId: idCompte("membre2"),
    equipe: "photo_video",
    statut: "a_faire",
    echeance: jour(aujourdhui, 0),
    ...horodatage,
  });

  return {
    entites,
    utilisateurs,
    suivis,
    actifs,
    demandes,
    projets,
    affectations,
    jalons,
    taches,
    dependances,
    publications,
    mesures,
  };
}
