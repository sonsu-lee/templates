import { getHealth } from "@/server/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getHealth());
  } catch {
    return Response.json({ status: "unavailable" }, { status: 502 });
  }
}
