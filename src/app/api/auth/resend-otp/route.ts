import { NextResponse } from "next/server";

const BACKEND = process.env.FASTAPI_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const body  = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    await fetch(`${BACKEND}/auth/resend-otp`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email }),
    });
  } catch {
    return NextResponse.json({ error: "Cannot reach the authentication server." }, { status: 502 });
  }

  // Always respond with the same message regardless of whether the email exists
  return NextResponse.json({ message: "If your email exists, a new OTP has been sent." });
}
