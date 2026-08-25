import { NextResponse } from "next/server";
import {
  accessCookieOptions,
  refreshCookieOptions,
  sessionCookieOptions,
  type SessionPayload,
} from "@/lib/auth";

const BACKEND = process.env.FASTAPI_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email    = typeof body?.email    === "string" ? body.email.trim().toLowerCase() : "";
  const otp_code = typeof body?.otp_code === "string" ? body.otp_code.trim() : "";

  if (!email || !otp_code) {
    return NextResponse.json({ error: "Email and OTP code are required." }, { status: 400 });
  }

  // 1. Verify OTP with backend → get tokens
  let verifyRes: Response;
  try {
    verifyRes = await fetch(`${BACKEND}/auth/verify-2fa`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, otp_code }),
    });
  } catch {
    return NextResponse.json({ error: "Cannot reach the authentication server. Try again later." }, { status: 502 });
  }

  const tokenData = await verifyRes.json().catch(() => ({}));
  if (!verifyRes.ok) {
    const detail = typeof tokenData.detail === "string" ? tokenData.detail : "Invalid or expired OTP.";
    return NextResponse.json({ error: detail }, { status: verifyRes.status });
  }

  const accessToken  = tokenData.access_token  as string;
  const refreshToken = tokenData.refresh_token as string;

  // 2. Fetch user info from backend using the new access token
  let meRes: Response;
  try {
    meRes = await fetch(`${BACKEND}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    return NextResponse.json({ error: "Token issued but failed to load user profile." }, { status: 502 });
  }

  const user = await meRes.json().catch(() => ({}));
  if (!meRes.ok) {
    return NextResponse.json({ error: "Token issued but user profile unavailable." }, { status: 502 });
  }

  const payload: SessionPayload = {
    userId:   String(user.id ?? ""),
    email:    String(user.email ?? email),
    fullName: String(user.full_name ?? email),
    role:     String(user.role?.name ?? "user"),
  };

  // 3. Build response and set all three httpOnly cookies
  const response = NextResponse.json({ ok: true });
  response.cookies.set(await sessionCookieOptions(payload));
  response.cookies.set(accessCookieOptions(accessToken));
  response.cookies.set(refreshCookieOptions(refreshToken));
  return response;
}
