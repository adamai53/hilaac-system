import { QUEUE_NAMES, demoJobSchema, type DemoJob } from "@hilaac/core";
import { Queue, Worker, type Job } from "bullmq";
import type { Redis } from "ioredis";
import type { Logger } from "pino";

export const DEMO_SCHEDULER_ID = "demo-heartbeat";
const DEMO_SCHEDULE_EVERY_MS = 30_000;

export function processDemoJob(job: Job<DemoJob>, logger: Logger): void {
  const payload = demoJobSchema.parse(job.data);
  logger.info(
    {
      queue: job.queueName,
      jobId: job.id,
      jobName: job.name,
      message: payload.message,
    },
    "Job de démonstration traité",
  );
}

export async function startDemoQueue(connection: Redis, logger: Logger) {
  const queue = new Queue<DemoJob>(QUEUE_NAMES.demo, { connection });
  const worker = new Worker<DemoJob>(
    QUEUE_NAMES.demo,
    (job) => Promise.try(() => processDemoJob(job, logger)),
    { connection },
  );

  worker.on("failed", (job, error) => {
    logger.error(
      { jobId: job?.id, err: error },
      "Échec du job de démonstration",
    );
  });

  await queue.upsertJobScheduler(
    DEMO_SCHEDULER_ID,
    { every: DEMO_SCHEDULE_EVERY_MS },
    { name: "heartbeat", data: { message: "Job planifié" } },
  );
  await queue.add("boot", { message: "Job de démarrage" });

  logger.info(
    { queue: QUEUE_NAMES.demo, everyMs: DEMO_SCHEDULE_EVERY_MS },
    "File de démonstration démarrée",
  );

  return {
    close: async () => {
      await worker.close();
      await queue.close();
    },
  };
}
