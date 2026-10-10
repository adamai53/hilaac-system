import { parseEnv, webEnvSchema } from "@hilaac/core";
import { afterAll, describe, expect, it } from "vitest";
import { ENTITES, idDemo } from "../../scripts/demo/donnees";
import { createAppDatabase, TOUTES_LES_ENTITES } from "../tenant";
import { accueilEquipe, listerEntites } from "./equipe";
import { performancePortail } from "./portail";

// Valeurs calculées par les requêtes, comparées au jeu de démonstration (base seedée par globalSetup).

const app = createAppDatabase(
  parseEnv(webEnvSchema.pick({ DATABASE_URL_APP: true }), "test")
    .DATABASE_URL_APP,
);

afterAll(() => app.close());

const LEAD = idDemo("utilisateur:lead");
const MEMBRE_ORVIA = idDemo("utilisateur:membre2");
const REFERENT_KELVANE = idDemo("utilisateur:referent-kelvane");

describe("listerEntites", () => {
  it("compte demandes ouvertes, actifs et projet en cours de chaque entité", async () => {
    const entites = await app.withTenant(
      { utilisateurId: LEAD, entiteId: TOUTES_LES_ENTITES },
      listerEntites,
    );
    const attendu = ENTITES.map((m) => ({
      nom: m.nom,
      demandesOuvertes: m.demandes.filter(
        (d) => !["terminee", "refusee"].includes(d.statut),
      ).length,
      actifs: 4,
      projetEnCours: m.projet.nom,
    }));
    expect(
      entites.map(({ nom, demandesOuvertes, actifs, projetEnCours }) => ({
        nom,
        demandesOuvertes,
        actifs,
        projetEnCours,
      })),
    ).toEqual(expect.arrayContaining(attendu));
    expect(entites).toHaveLength(3);
  });
});

describe("accueilEquipe", () => {
  it("liste les jalons à risque avec leurs tâches ouvertes", async () => {
    const accueil = await app.withTenant(
      { utilisateurId: LEAD, entiteId: idDemo("entite:kelvane") },
      (tx) => accueilEquipe(tx, LEAD),
    );
    expect(
      accueil.jalonsARisque.map((j) => [j.titre, j.tachesOuvertes]),
    ).toEqual([
      ["Contenus livrés", 3],
      ["Maquettes validées", 3],
    ]);
  });

  it("montre à un membre sa tâche hors affectation, sans le nom du projet", async () => {
    const accueil = await app.withTenant(
      { utilisateurId: MEMBRE_ORVIA, entiteId: TOUTES_LES_ENTITES },
      (tx) => accueilEquipe(tx, MEMBRE_ORVIA),
    );
    expect(accueil.tachesDuJour).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          titre: "Vidéo de la flotte électrique",
          projet: null,
        }),
        expect.objectContaining({
          titre: "Maquettes desktop",
          projet: "Prise de rendez-vous en ligne",
        }),
      ]),
    );
  });
});

describe("performancePortail", () => {
  it("rattache à chaque publication du mois son engagement mesuré", async () => {
    const performance = await app.withTenant(
      { utilisateurId: REFERENT_KELVANE, entiteId: idDemo("entite:kelvane") },
      performancePortail,
    );
    expect(performance?.entite.nom).toBe("Kelvane Logistique");
    expect(performance?.trafic).toHaveLength(60);
    for (const publication of performance?.publicationsDuMois ?? []) {
      expect(publication.engagement, publication.contenu).toBeGreaterThan(0);
    }
  });
});
