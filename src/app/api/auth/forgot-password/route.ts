import { NextResponse } from "next/server";

const BACKEND = process.env.FASTAPI_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable. Please try again later." }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data.detail === "string" ? data.detail : "Something went wrong.";
    return NextResponse.json({ error: detail }, { status: res.status });
  }

  return NextResponse.json({ message: data.message ?? "If that email is registered, a reset link has been sent." });
}
