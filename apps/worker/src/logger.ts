import { pino, type Logger } from "pino";
import type { WorkerEnv } from "@hilaac/core";

export function createLogger(
  env: Pick<WorkerEnv, "LOG_LEVEL" | "NODE_ENV">,
): Logger {
  return pino({
    level: env.LOG_LEVEL,
    base: { service: "worker" },
    ...(env.NODE_ENV === "development" && {
      transport: {
        target: "pino-pretty",
        options: { translateTime: "SYS:HH:MM:ss" },
      },
    }),
  });
}
