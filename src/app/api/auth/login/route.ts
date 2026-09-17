import { NextResponse } from "next/server";
import {
  accessCookieOptions,
  refreshCookieOptions,
  sessionCookieOptions,
} from "@/lib/auth";

const BACKEND_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email    = typeof body?.email    === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  let accessToken: string;
  let refreshToken: string;
  try {
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    if (loginRes.status === 401 || loginRes.status === 403) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }
    if (!loginRes.ok) {
      return NextResponse.json({ error: "Authentication service unavailable." }, { status: 503 });
    }
    const tokens = await loginRes.json();
    accessToken  = tokens.access_token;
    refreshToken = tokens.refresh_token;
  } catch {
    return NextResponse.json({ error: "Authentication service unavailable." }, { status: 503 });
  }

  let name: string;
  let role: "admin" | "user";
  try {
    const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!meRes.ok) {
      return NextResponse.json({ error: "Authentication service unavailable." }, { status: 503 });
    }
    const user = await meRes.json();
    name = user.full_name ?? email;
    role = user.role?.name === "administrator" ? "admin" : "user";
  } catch {
    return NextResponse.json({ error: "Authentication service unavailable." }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(await sessionCookieOptions({ email, name, role }));
  response.cookies.set(accessCookieOptions(accessToken));
  response.cookies.set(refreshCookieOptions(refreshToken));
  return response;
}
