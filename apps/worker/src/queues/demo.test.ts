import type { DemoJob } from "@hilaac/core";
import type { Job } from "bullmq";
import { pino } from "pino";
import { describe, expect, it, vi } from "vitest";
import { processDemoJob } from "./demo";

function fakeJob(data: unknown): Job<DemoJob> {
  return { id: "1", name: "boot", queueName: "demo", data } as Job<DemoJob>;
}

describe("processDemoJob", () => {
  it("journalise le message du job", () => {
    const logger = pino({ enabled: false });
    const info = vi.spyOn(logger, "info");
    processDemoJob(fakeJob({ message: "bonjour" }), logger);
    expect(info).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: "1", message: "bonjour" }),
      "Job de démonstration traité",
    );
  });

  it("rejette une charge utile invalide", () => {
    const logger = pino({ enabled: false });
    expect(() => processDemoJob(fakeJob({ message: "" }), logger)).toThrow();
  });
});
