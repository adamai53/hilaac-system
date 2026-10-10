import { parseEnv, webEnvSchema, type WebEnv } from "@hilaac/core";

let cached: WebEnv | undefined;

/** Variables d'environnement du serveur web, validées une seule fois. */
export function getWebEnv(): WebEnv {
  cached ??= parseEnv(webEnvSchema, "web");
  return cached;
}
