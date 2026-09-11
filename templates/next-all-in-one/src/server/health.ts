import "server-only";

export function getHealth() {
  return { status: "ok" } as const;
}
