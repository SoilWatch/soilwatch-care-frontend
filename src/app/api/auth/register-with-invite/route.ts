import { NextResponse } from "next/server";

const BACKEND = process.env.FASTAPI_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const body      = await request.json().catch(() => null);
  const token     = typeof body?.token     === "string" ? body.token.trim()                   : "";
  const email     = typeof body?.email     === "string" ? body.email.trim().toLowerCase()     : "";
  const password  = typeof body?.password  === "string" ? body.password                       : "";
  const full_name = typeof body?.full_name === "string" ? body.full_name.trim()               : "";

  if (!token || !email || !password || !full_name) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND}/auth/register-with-invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, password, full_name }),
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable. Please try again later." }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data.detail === "string" ? data.detail : "Registration failed. The invite link may be invalid or expired.";
    return NextResponse.json({ error: detail }, { status: res.status });
  }

  return NextResponse.json({ message: data.message ?? "Account created successfully." });
}
