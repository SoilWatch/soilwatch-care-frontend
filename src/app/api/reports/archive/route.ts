import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const res = await backendFetch("/api/reports/archive", { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ reports: [], error: `Backend returned ${res.status}.` }, { status: 502 });
    }
    return NextResponse.json(await res.json(), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ reports: [], error: `Failed to reach backend: ${message}` }, { status: 502 });
  }
}
