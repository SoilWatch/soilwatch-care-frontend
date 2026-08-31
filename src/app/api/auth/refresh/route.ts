import { NextResponse } from "next/server";
import {
  getRefreshToken,
  accessCookieOptions,
  refreshCookieOptions,
  clearCookieOptions,
  SESSION_COOKIE,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from "@/lib/auth";

const BACKEND = process.env.FASTAPI_URL ?? "http://localhost:8000";

export async function POST() {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token." }, { status: 401 });
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND}/auth/refresh-token`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    return NextResponse.json({ error: "Cannot reach the authentication server." }, { status: 502 });
  }

  if (!res.ok) {
    // Refresh token is invalid or expired — clear everything and force re-login
    const response = NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
    response.cookies.set(clearCookieOptions(SESSION_COOKIE));
    response.cookies.set(clearCookieOptions(ACCESS_COOKIE));
    response.cookies.set(clearCookieOptions(REFRESH_COOKIE));
    return response;
  }

  const data = await res.json();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(accessCookieOptions(data.access_token));
  response.cookies.set(refreshCookieOptions(data.refresh_token));
  return response;
}
