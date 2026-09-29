import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { backendFetch } from "@/lib/backend-fetch";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const res = await backendFetch(`/auth/users/${id}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role_id: body?.role_id ?? null }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
