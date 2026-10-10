import { parseEnvOrExit, workerEnvSchema } from "@hilaac/core";
import { Redis } from "ioredis";
import { createLogger } from "./logger";
import { startDemoQueue } from "./queues/demo";

const env = parseEnvOrExit(workerEnvSchema, "worker");
const logger = createLogger(env);
// BullMQ exige maxRetriesPerRequest: null pour les connexions bloquantes des workers.
const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const demoQueue = await startDemoQueue(connection, logger);

let shuttingDown = false;
async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Arrêt du worker demandé");
  try {
    await demoQueue.close();
    await connection.quit();
    logger.info("Worker arrêté proprement");
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Erreur pendant l'arrêt du worker");
    process.exit(1);
  }
}

process.on("SIGTERM", (signal) => void shutdown(signal));
process.on("SIGINT", (signal) => void shutdown(signal));
