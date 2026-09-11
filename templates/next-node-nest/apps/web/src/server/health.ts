import "server-only";

export async function getHealth(): Promise<{ status: "ok" }> {
  const response = await fetch(new URL("/health", process.env.API_URL ?? "http://localhost:3001"), {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Nest health check returned ${response.status}`);
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null || !("status" in body) || body.status !== "ok") {
    throw new Error("Unexpected Nest health response");
  }
  return { status: "ok" };
}
