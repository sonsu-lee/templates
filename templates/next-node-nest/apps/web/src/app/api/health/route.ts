import { getHealth } from "@/server/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getHealth());
  } catch (error) {
    console.error("Nest health check failed", error);
    return Response.json({ status: "unavailable" }, { status: 502 });
  }
}
