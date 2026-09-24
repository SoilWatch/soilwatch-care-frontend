import { NextResponse } from "next/server";

const BACKEND_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email     = typeof body?.email     === "string" ? body.email.trim().toLowerCase() : "";
  const password  = typeof body?.password  === "string" ? body.password : "";
  const full_name = typeof body?.full_name === "string" ? body.full_name.trim() : "";

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name }),
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail ?? "Registration failed." },
        { status: res.status },
      );
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Service unavailable. Please try again." }, { status: 503 });
  }
}
