import { NextResponse } from "next/server";
import { getSession, getAccessToken } from "@/lib/auth";

const BACKEND_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const current_password = typeof body?.current_password === "string" ? body.current_password : "";
  const new_password     = typeof body?.new_password     === "string" ? body.new_password     : "";

  if (!current_password || !new_password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const accessToken = await getAccessToken();
  const res = await fetch(`${BACKEND_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ current_password, new_password }),
    cache: "no-store",
  });

  if (res.status === 400) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ error: data.detail ?? "Invalid request." }, { status: 400 });
  }
  if (res.status === 401) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }
  if (!res.ok) {
    return NextResponse.json({ error: "Password change failed. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
