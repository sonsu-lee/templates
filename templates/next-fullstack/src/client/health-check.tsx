"use client";

import { useState } from "react";

export function HealthCheck() {
  const [status, setStatus] = useState("Not checked");
  const [pending, setPending] = useState(false);

  async function checkHealth(): Promise<void> {
    setPending(true);
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!response.ok) throw new Error(`Health check returned ${response.status}`);
      const body: unknown = await response.json();
      if (
        typeof body !== "object" ||
        body === null ||
        !("status" in body) ||
        body.status !== "ok"
      ) {
        throw new Error("Unexpected health response");
      }
      setStatus("Healthy");
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Health check failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-label="Health check">
      <button
        disabled={pending}
        onClick={() => {
          void checkHealth();
        }}
      >
        Check health
      </button>
      <p>
        <output>{pending ? "Checking…" : status}</output>
      </p>
    </section>
  );
}
