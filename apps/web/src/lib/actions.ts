"use server";

import type { Espace } from "@hilaac/core";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { EN_TETE_ESPACE, getAuth, urlAccueil, urlConnexion } from "./auth";
import { COOKIE_ENTITE } from "./selection-entite";
import { requireEspace } from "./session";

export interface EtatConnexion {
  erreur: string | null;
}

const identifiantsSchema = z.object({
  email: z.email(),
  motDePasse: z.string().min(1),
});

export async function seConnecter(
  espace: Espace,
  _etat: EtatConnexion,
  formulaire: FormData,
): Promise<EtatConnexion> {
  const identifiants = identifiantsSchema.safeParse({
    email: formulaire.get("email"),
    motDePasse: formulaire.get("motDePasse"),
  });
  if (!identifiants.success)
    return { erreur: "Saisissez un e-mail et un mot de passe." };

  // L'espace accompagne la requête : le hook de session refuse un compte de l'autre famille.
  const enTetes = new Headers(await headers());
  enTetes.set(EN_TETE_ESPACE, espace);
  try {
    await getAuth().api.signInEmail({
      body: {
        email: identifiants.data.email,
        password: identifiants.data.motDePasse,
      },
      headers: enTetes,
    });
  } catch {
    // Même message pour un mauvais mot de passe et un compte d'une autre famille.
    return { erreur: "Identifiants invalides pour cet espace." };
  }
  redirect(urlAccueil(espace));
}

export async function seDeconnecter(espace: Espace) {
  await getAuth().api.signOut({ headers: await headers() });
  redirect(urlConnexion(espace));
}

export async function choisirEntite(formulaire: FormData) {
  await requireEspace("equipe");
  const choix = z.uuid().safeParse(formulaire.get("entite"));
  const magasin = await cookies();
  if (choix.success) {
    magasin.set(COOKIE_ENTITE, choix.data, {
      httpOnly: true,
      sameSite: "lax",
      path: "/app",
    });
  } else {
    magasin.delete({ name: COOKIE_ENTITE, path: "/app" });
  }
  const retour = z
    .string()
    .startsWith("/app")
    .safeParse(formulaire.get("retour"));
  redirect(retour.success ? retour.data : "/app");
}
