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
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  // 1. Authenticate with backend → get tokens
  let loginRes: Response;
  try {
    loginRes = await fetch(`${BACKEND}/auth/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password }),
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable. Please try again later." }, { status: 502 });
  }

  const tokenData = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok) {
    const detail = typeof tokenData.detail === "string" ? tokenData.detail : "Invalid email or password.";
    return NextResponse.json({ error: detail }, { status: loginRes.status });
  }

  const accessToken  = tokenData.access_token  as string;
  const refreshToken = tokenData.refresh_token as string;

  // 2. Fetch user profile using the access token
  let meRes: Response;
  try {
    meRes = await fetch(`${BACKEND}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    return NextResponse.json({ error: "Authentication succeeded but your profile could not be loaded. Please try again." }, { status: 502 });
  }

  const user = await meRes.json().catch(() => ({}));
  if (!meRes.ok) {
    return NextResponse.json({ error: "Authentication succeeded but your profile could not be loaded. Please try again." }, { status: 502 });
  }

  const payload: SessionPayload = {
    userId:   String(user.id ?? ""),
    email:    String(user.email ?? email),
    fullName: String(user.full_name ?? email),
    role:     String(user.role?.name ?? "user"),
  };

  // 3. Set all three httpOnly cookies
  const response = NextResponse.json({ ok: true });
  response.cookies.set(await sessionCookieOptions(payload));
  response.cookies.set(accessCookieOptions(accessToken));
  response.cookies.set(refreshCookieOptions(refreshToken));
  return response;
}
