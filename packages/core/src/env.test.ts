import { describe, expect, it } from "vitest";
import {
  EnvValidationError,
  parseEnv,
  webEnvSchema,
  workerEnvSchema,
} from "./env";

const validWebEnv = {
  DATABASE_URL_APP: "postgres://app:pass@localhost:5432/db",
  DATABASE_URL_AUTH: "postgres://auth:pass@localhost:5432/db",
  REDIS_URL: "redis://localhost:6379",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("renvoie les valeurs typées quand la configuration est valide", () => {
    expect(parseEnv(webEnvSchema, "web", validWebEnv)).toEqual(validWebEnv);
  });

  it("applique les valeurs par défaut du worker", () => {
    const env = parseEnv(workerEnvSchema, "worker", {
      REDIS_URL: validWebEnv.REDIS_URL,
    });
    expect(env).toEqual({
      NODE_ENV: "development",
      REDIS_URL: validWebEnv.REDIS_URL,
      LOG_LEVEL: "info",
    });
  });

  it("nomme chaque variable manquante dans le message d'erreur", () => {
    const parse = () => parseEnv(webEnvSchema, "web", {});
    expect(parse).toThrow(EnvValidationError);
    expect(parse).toThrow(/Configuration invalide pour web/);
    expect(parse).toThrow(/DATABASE_URL_APP : variable manquante/);
    expect(parse).toThrow(/BETTER_AUTH_SECRET : variable manquante/);
    expect(parse).toThrow(/REDIS_URL : variable manquante/);
  });

  it("rejette une URL dont le protocole ne correspond pas", () => {
    const parse = () =>
      parseEnv(webEnvSchema, "web", {
        ...validWebEnv,
        DATABASE_URL_APP: "mysql://localhost/db",
      });
    expect(parse).toThrow(/DATABASE_URL_APP : /);
    expect(parse).not.toThrow(/DATABASE_URL_APP : variable manquante/);
  });
});
