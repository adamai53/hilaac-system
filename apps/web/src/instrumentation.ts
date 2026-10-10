export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { parseEnvOrExit, webEnvSchema } = await import("@hilaac/core");
  parseEnvOrExit(webEnvSchema, "web");
}
