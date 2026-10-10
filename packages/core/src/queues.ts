import { z } from "zod";

export const QUEUE_NAMES = {
  demo: "demo",
} as const;

export const demoJobSchema = z.object({
  message: z.string().min(1),
});

export type DemoJob = z.infer<typeof demoJobSchema>;
