import { z } from "zod";

export const ROLES_EQUIPE = ["admin", "direction", "lead", "membre"] as const;
export const ROLES_CLIENT = ["referent_client", "lecteur_client"] as const;
export const ROLES = [...ROLES_EQUIPE, ...ROLES_CLIENT] as const;

export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

/** Deux surfaces étanches : /app pour l'équipe, /portail pour les clients. */
export type Espace = "equipe" | "client";

export function espaceDuRole(role: Role): Espace {
  return (ROLES_EQUIPE as readonly Role[]).includes(role) ? "equipe" : "client";
}
