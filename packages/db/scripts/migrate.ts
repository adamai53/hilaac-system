import { fileURLToPath } from "node:url";
import { migrationEnvSchema, parseEnvOrExit } from "@hilaac/core";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "../src/client";

const env = parseEnvOrExit(migrationEnvSchema, "db:migrate");
const { db, close } = createDatabase(env.DATABASE_URL, { maxConnections: 1 });

// Chaque URL doit viser le rôle attendu ; son mot de passe devient celui du rôle.
const rolesDeConnexion = [
  {
    role: "hilaac_app",
    variable: "DATABASE_URL_APP",
    url: env.DATABASE_URL_APP,
  },
  {
    role: "hilaac_auth",
    variable: "DATABASE_URL_AUTH",
    url: env.DATABASE_URL_AUTH,
  },
  {
    role: "hilaac_worker",
    variable: "DATABASE_URL_WORKER",
    url: env.DATABASE_URL_WORKER,
  },
] as const;

try {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url)),
  });

  for (const { role, variable, url } of rolesDeConnexion) {
    const { username, password } = new URL(url);
    if (decodeURIComponent(username) !== role) {
      throw new Error(
        `${variable} doit utiliser le rôle ${role} (trouvé : ${username || "aucun"}).`,
      );
    }
    if (!password) {
      throw new Error(`${variable} doit contenir un mot de passe.`);
    }
    const [requete] = await db.execute<{ q: string }>(
      sql`select format('alter role %I with login password %L', ${role}::text, ${decodeURIComponent(password)}::text) as q`,
    );
    if (!requete)
      throw new Error(`Impossible de préparer la connexion du rôle ${role}.`);
    await db.execute(sql.raw(requete.q));
  }

  console.log("Migrations appliquées, rôles de connexion à jour.");
} finally {
  await close();
}
