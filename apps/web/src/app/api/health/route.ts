import { getAppDb } from "@/lib/db";
import { pingRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const CHECK_TIMEOUT_MS = 3_000;

type CheckResult =
  { status: "up"; latencyMs: number } | { status: "down"; error: string };

async function runCheck(probe: () => Promise<number>): Promise<CheckResult> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`délai de ${CHECK_TIMEOUT_MS} ms dépassé`)),
      CHECK_TIMEOUT_MS,
    );
  });
  try {
    return { status: "up", latencyMs: await Promise.race([probe(), timeout]) };
  } catch (error) {
    return {
      status: "down",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const [postgres, redis] = await Promise.all([
    runCheck(() => getAppDb().ping()),
    runCheck(pingRedis),
  ]);
  const healthy = postgres.status === "up" && redis.status === "up";
  return Response.json(
    { status: healthy ? "ok" : "error", checks: { postgres, redis } },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
