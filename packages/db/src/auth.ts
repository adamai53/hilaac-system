import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDatabase } from "./client";
import { compte, session, utilisateur, verification } from "./schema";

/** Adaptateur Better Auth sur la connexion du rôle hilaac_auth (tables d'authentification seules). */
export function createAuthAdapter(url: string) {
  const { db } = createDatabase(url, { maxConnections: 5 });
  return drizzleAdapter(db, {
    provider: "pg",
    schema: { utilisateur, session, compte, verification },
  });
}

/** Correspondance entre les modèles Better Auth et les tables françaises du schéma. */
export const authModeles = {
  user: {
    modelName: "utilisateur",
    fields: {
      name: "nom",
      emailVerified: "emailVerifie",
      createdAt: "creeLe",
      updatedAt: "misAJourLe",
    },
    additionalFields: {
      role: { type: "string", required: true, input: false },
      entiteId: { type: "string", required: false, input: false },
    },
  },
  session: {
    modelName: "session",
    fields: {
      userId: "utilisateurId",
      expiresAt: "expireLe",
      ipAddress: "adresseIp",
      userAgent: "agentUtilisateur",
      createdAt: "creeLe",
      updatedAt: "misAJourLe",
    },
  },
  account: {
    modelName: "compte",
    fields: {
      userId: "utilisateurId",
      accountId: "identifiantCompte",
      providerId: "fournisseur",
      accessToken: "jetonAcces",
      refreshToken: "jetonRafraichissement",
      idToken: "jetonIdentite",
      accessTokenExpiresAt: "jetonAccesExpireLe",
      refreshTokenExpiresAt: "jetonRafraichissementExpireLe",
      scope: "portee",
      password: "motDePasse",
      createdAt: "creeLe",
      updatedAt: "misAJourLe",
    },
  },
  verification: {
    modelName: "verification",
    fields: {
      identifier: "identifiant",
      value: "valeur",
      expiresAt: "expireLe",
      createdAt: "creeLe",
      updatedAt: "misAJourLe",
    },
  },
} as const;
