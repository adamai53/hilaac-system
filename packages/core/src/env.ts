import { z } from "zod";

const redisUrlSchema = z.url({ protocol: /^rediss?$/ });
const postgresUrlSchema = z.url({ protocol: /^postgres(ql)?$/ });

/** Connexion propriétaire : migrations et seed uniquement. */
export const databaseEnvSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
});

/** db:migrate pose le mot de passe de chaque rôle de connexion à partir de son URL. */
export const migrationEnvSchema = databaseEnvSchema.extend({
  DATABASE_URL_APP: postgresUrlSchema,
  DATABASE_URL_AUTH: postgresUrlSchema,
  DATABASE_URL_WORKER: postgresUrlSchema,
});

export const webEnvSchema = z.object({
  DATABASE_URL_APP: postgresUrlSchema,
  DATABASE_URL_AUTH: postgresUrlSchema,
  REDIS_URL: redisUrlSchema,
  BETTER_AUTH_SECRET: z.string().min(32, "32 caractères minimum"),
  BETTER_AUTH_URL: z.url(),
});

export const workerEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  REDIS_URL: redisUrlSchema,
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
export type MigrationEnv = z.infer<typeof migrationEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export class EnvValidationError extends Error {
  override readonly name = "EnvValidationError";
}

/**
 * Valide les variables d'environnement d'un processus.
 * Lève une EnvValidationError qui liste chaque variable manquante ou invalide.
 */
export function parseEnv<TSchema extends z.ZodType>(
  schema: TSchema,
  processName: string,
  source: Record<string, string | undefined> = process.env,
): z.output<TSchema> {
  const result = schema.safeParse(source);
  if (result.success) {
    return result.data;
  }
  const details = result.error.issues.map((issue) => {
    const variable = issue.path.join(".");
    const reason =
      source[variable] === undefined ? "variable manquante" : issue.message;
    return `  - ${variable} : ${reason}`;
  });
  throw new EnvValidationError(
    [
      `Configuration invalide pour ${processName}. Variables d'environnement en erreur :`,
      ...details,
      "Copiez .env.example vers .env et complétez les valeurs.",
    ].join("\n"),
  );
}

/**
 * Variante pour les points d'entrée de processus : affiche le message
 * et termine le processus avec le code 1 si la configuration est invalide.
 */
export function parseEnvOrExit<TSchema extends z.ZodType>(
  schema: TSchema,
  processName: string,
): z.output<TSchema> {
  try {
    return parseEnv(schema, processName);
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
}
