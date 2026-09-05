import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BACKEND_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

const FORMATS = new Set(["pdf", "docx"]);

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "pdf";
  if (!FORMATS.has(format)) {
    return NextResponse.json({ error: "format must be pdf or docx." }, { status: 400 });
  }

  const qs = new URLSearchParams({ format });
  for (const key of ["date_from", "date_to", "title"]) {
    const value = searchParams.get(key);
    if (value) qs.set(key, value);
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/production?${qs}`, { cache: "no-store" });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Report backend returned ${res.status}.`, detail },
        { status: 502 },
      );
    }
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type":
          res.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition":
          res.headers.get("content-disposition") ?? `attachment; filename="report.${format}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to reach report backend: ${message}` }, { status: 502 });
  }
}
