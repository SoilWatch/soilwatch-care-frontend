import { NextResponse } from "next/server";
import { clearCookieOptions, SESSION_COOKIE, ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearCookieOptions(SESSION_COOKIE));
  response.cookies.set(clearCookieOptions(ACCESS_COOKIE));
  response.cookies.set(clearCookieOptions(REFRESH_COOKIE));
  return response;
}
