import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { backendFetch } from "@/lib/backend-fetch";

const ID_RE = /^[0-9]{8}_[0-9]{6}_(pdf|docx)$/;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  if (!ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid report id." }, { status: 400 });
  }

  try {
    const res = await backendFetch(`/api/reports/archive/${id}`, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: `Report not found (${res.status}).` }, { status: res.status });
    }
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition":
          res.headers.get("content-disposition") ?? `attachment; filename="${id}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to reach backend: ${message}` }, { status: 502 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  if (!ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid report id." }, { status: 400 });
  }

  try {
    const res = await backendFetch(`/api/reports/archive/${id}`, {
      method: "DELETE",
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Delete failed (${res.status}).` }, { status: res.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to reach backend: ${message}` }, { status: 502 });
  }
}
