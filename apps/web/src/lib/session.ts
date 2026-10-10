import { espaceDuRole, roleSchema, type Espace, type Role } from "@hilaac/core";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import { getAuth, urlConnexion } from "./auth";

export interface UtilisateurConnecte {
  id: string;
  nom: string;
  email: string;
  role: Role;
  /** Entité de rattachement d'un client ; null pour l'équipe. */
  entiteId: string | null;
}

const lireSession = cache(async (): Promise<UtilisateurConnecte | null> => {
  // headers() d'abord : la page devient dynamique avant toute lecture de l'environnement,
  // le build n'a donc besoin d'aucune variable.
  const enTetes = await headers();
  const resultat = await getAuth().api.getSession({ headers: enTetes });
  if (!resultat) return null;
  const { user } = resultat;
  return {
    id: user.id,
    nom: user.name,
    email: user.email,
    role: roleSchema.parse(user.role),
    entiteId: typeof user.entiteId === "string" ? user.entiteId : null,
  };
});

/**
 * Garde serveur de chaque page : sans session, renvoie vers la connexion de l'espace ;
 * avec un compte de l'autre famille, répond 403 (forbidden), sans rien rendre de la page.
 */
export async function requireEspace(
  espace: "equipe",
): Promise<UtilisateurConnecte>;
export async function requireEspace(
  espace: "client",
): Promise<UtilisateurConnecte & { entiteId: string }>;
export async function requireEspace(
  espace: Espace,
): Promise<UtilisateurConnecte> {
  const utilisateur = await lireSession();
  if (!utilisateur) redirect(urlConnexion(espace));
  if (espaceDuRole(utilisateur.role) !== espace) forbidden();
  if (espace === "client" && !utilisateur.entiteId) forbidden();
  return utilisateur;
}

/** Session éventuelle, sans garde : pour les pages de connexion. */
export function sessionCourante() {
  return lireSession();
}
