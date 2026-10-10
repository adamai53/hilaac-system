import { Redis } from "ioredis";
import { getWebEnv } from "./env";

// Conservé sur globalThis pour ne pas multiplier les connexions lors du rechargement à chaud.
const globalForRedis = globalThis as typeof globalThis & {
  hilaacRedis?: Redis;
};

export function getRedis(): Redis {
  globalForRedis.hilaacRedis ??= new Redis(getWebEnv().REDIS_URL, {
    connectTimeout: 2_000,
    maxRetriesPerRequest: 1,
  });
  return globalForRedis.hilaacRedis;
}

/** Envoie un PING et renvoie la latence en millisecondes. */
export async function pingRedis(): Promise<number> {
  const start = performance.now();
  await getRedis().ping();
  return Math.round(performance.now() - start);
}
