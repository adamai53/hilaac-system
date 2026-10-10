import { espaceDuRole, roleSchema, type Espace } from "@hilaac/core";
import { authModeles, createAuthAdapter } from "@hilaac/db";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { getWebEnv } from "./env";

/** En-tête posé par l'action de connexion : l'espace visé par la surface d'entrée. */
export const EN_TETE_ESPACE = "x-hilaac-espace";

function creerAuth() {
  const env = getWebEnv();
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: createAuthAdapter(env.DATABASE_URL_AUTH),
    ...authModeles,
    emailAndPassword: { enabled: true, disableSignUp: true },
    advanced: { database: { generateId: "uuid" } },
    databaseHooks: {
      session: {
        create: {
          // Aucune session n'est créée si le compte n'appartient pas à l'espace de connexion.
          before: async (session, contexte) => {
            const espace = contexte?.headers?.get(EN_TETE_ESPACE);
            if (espace !== "equipe" && espace !== "client") return false;
            const utilisateur =
              await contexte?.context.internalAdapter.findUserById(
                session.userId,
              );
            const role = roleSchema.safeParse(
              utilisateur && "role" in utilisateur
                ? utilisateur.role
                : undefined,
            );
            return role.success && espaceDuRole(role.data) === espace;
          },
        },
      },
    },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof creerAuth>;

const globalForAuth = globalThis as typeof globalThis & { hilaacAuth?: Auth };

export function getAuth(): Auth {
  globalForAuth.hilaacAuth ??= creerAuth();
  return globalForAuth.hilaacAuth;
}

export function urlConnexion(espace: Espace) {
  return espace === "equipe" ? "/connexion" : "/portail/connexion";
}

export function urlAccueil(espace: Espace) {
  return espace === "equipe" ? "/app" : "/portail";
}
