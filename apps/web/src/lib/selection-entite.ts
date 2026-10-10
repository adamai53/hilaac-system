import { TOUTES_LES_ENTITES } from "@hilaac/db";
import { cookies } from "next/headers";
import { z } from "zod";

export const COOKIE_ENTITE = "hilaac_entite";

/**
 * Entité choisie dans le sélecteur de l'espace équipe, « toutes » par défaut. Simple préférence
 * d'affichage : la base décide de ce qui est visible, quelle que soit la valeur du cookie.
 */
export async function entiteSelectionnee(): Promise<string> {
  const valeur = (await cookies()).get(COOKIE_ENTITE)?.value;
  return z.uuid().safeParse(valeur).success && valeur
    ? valeur
    : TOUTES_LES_ENTITES;
}
