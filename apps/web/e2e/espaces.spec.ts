import { espaceDuRole } from "@hilaac/core";
import { COMPTES, idDemo, MOT_DE_PASSE_DEMO } from "@hilaac/db/demo";
import { expect, test, type Page } from "@playwright/test";

// Base seedée requise (pnpm db:seed) : les comptes et identifiants viennent du jeu de démonstration.

const compte = (cle: (typeof COMPTES)[number]["cle"]) => {
  const trouve = COMPTES.find((c) => c.cle === cle);
  if (!trouve) throw new Error(`Compte de démonstration inconnu : ${cle}`);
  return trouve;
};

const ACCUEIL = {
  "/connexion": "/app",
  "/portail/connexion": "/portail",
} as const;

/** Se connecte et attend l'accueil de l'espace ; `refus` attend au contraire le message d'erreur. */
async function seConnecter(
  page: Page,
  surface: "/connexion" | "/portail/connexion",
  email: string,
  { refus = false } = {},
) {
  await page.goto(surface);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(MOT_DE_PASSE_DEMO);
  await page.getByRole("button", { name: "Se connecter" }).click();
  if (refus) {
    await expect(
      page.getByText("Identifiants invalides pour cet espace."),
    ).toBeVisible();
  } else {
    await expect(page).toHaveURL(ACCUEIL[surface]);
  }
}

test.describe("connexion des comptes de démonstration", () => {
  for (const c of COMPTES) {
    test(`${c.email} (${c.role})`, async ({ page }) => {
      const equipe = espaceDuRole(c.role) === "equipe";
      await seConnecter(
        page,
        equipe ? "/connexion" : "/portail/connexion",
        c.email,
      );
      await expect(page).toHaveURL(equipe ? "/app" : "/portail");
      await expect(page.getByRole("banner")).toContainText(c.nom);

      await page.getByRole("button", { name: "Se déconnecter" }).click();
      await expect(page).toHaveURL(
        equipe ? "/connexion" : "/portail/connexion",
      );
    });
  }
});

test.describe("surfaces étanches", () => {
  test("un compte équipe est refusé par la connexion du portail, sans session créée", async ({
    page,
  }) => {
    await seConnecter(page, "/portail/connexion", compte("admin").email, {
      refus: true,
    });
    const reponse = await page.goto("/app");
    expect(page.url()).toContain("/connexion");
    expect(reponse?.status()).toBe(200);
  });

  test("un client connecté reçoit un 403 serveur sur /app et ses sous-pages", async ({
    page,
  }) => {
    await seConnecter(
      page,
      "/portail/connexion",
      compte("referent-kelvane").email,
    );
    await expect(page).toHaveURL("/portail");
    for (const url of [
      "/app",
      "/app/entites",
      `/app/entites/${idDemo("entite:sablon")}`,
    ]) {
      const reponse = await page.goto(url);
      expect(reponse?.status(), url).toBe(403);
      await expect(
        page.getByRole("heading", { name: "Accès refusé" }),
      ).toBeVisible();
    }
  });

  test("un compte équipe connecté reçoit un 403 serveur sur /portail", async ({
    page,
  }) => {
    await seConnecter(page, "/connexion", compte("direction").email);
    await expect(page).toHaveURL("/app");
    for (const url of ["/portail", "/portail/performance"]) {
      const reponse = await page.goto(url);
      expect(reponse?.status(), url).toBe(403);
    }
  });
});

test.describe("cloisonnement par entité", () => {
  test("le référent de Kelvane ne voit rien de Sablon, même en forçant l'URL", async ({
    page,
  }) => {
    await seConnecter(
      page,
      "/portail/connexion",
      compte("referent-kelvane").email,
    );
    for (const url of [
      `/portail?entite=${idDemo("entite:sablon")}`,
      `/portail/performance?entite=${idDemo("entite:sablon")}`,
    ]) {
      await page.goto(url);
      await expect(page.getByRole("main")).toContainText("Kelvane Logistique");
      await expect(page.locator("body")).not.toContainText("Hôtels Sablon");
      await expect(page.locator("body")).not.toContainText("Sophie Laurent");
    }
  });

  test("un membre voit l'entité mais pas le projet où il n'est pas affecté", async ({
    page,
  }) => {
    await seConnecter(page, "/connexion", compte("membre2").email);
    await expect(page.getByRole("main")).toContainText(
      "Vidéo de la flotte électrique",
    );
    await page.goto(`/app/entites/${idDemo("entite:kelvane")}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Kelvane Logistique",
    );
    await expect(page.getByRole("main")).toContainText(
      "Aucun projet en cours visible.",
    );
  });

  test("le lead voit les trois entités", async ({ page }) => {
    await seConnecter(page, "/connexion", compte("lead").email);
    await page.goto("/app/entites");
    await expect(page.getByRole("main")).toContainText("3 entités");
  });

  test("une entité inexistante ou mal formée donne 404", async ({ page }) => {
    await seConnecter(page, "/connexion", compte("admin").email);
    expect(
      (
        await page.goto(`/app/entites/${idDemo("entite:inexistante")}`)
      )?.status(),
    ).toBe(404);
    expect((await page.goto("/app/entites/pas-un-uuid"))?.status()).toBe(404);
  });
});
