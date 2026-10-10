import { z } from "zod";

const redisUrlSchema = z.url({ protocol: /^rediss?$/ });

export const databaseEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

export const webEnvSchema = databaseEnvSchema.extend({
  REDIS_URL: redisUrlSchema,
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
