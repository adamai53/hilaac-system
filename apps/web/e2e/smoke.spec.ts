import { expect, test } from "@playwright/test";

test("la page d'accueil s'affiche", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "HILAAC System" }),
  ).toBeVisible();
});

test("/api/health confirme Postgres et Redis", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({
    status: "ok",
    checks: { postgres: { status: "up" }, redis: { status: "up" } },
  });
});
