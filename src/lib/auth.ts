/**
 * Auth utilities for the Next.js frontend.
 *
 * Three cookies are stored after a successful login:
 *   sw_session       – signed frontend JWT (display info: userId, email, fullName, role)
 *   sw_access_token  – backend JWT (24 h) forwarded to backend API calls
 *   sw_refresh_token – backend JWT (7 d) used to obtain new access tokens
 *
 * Middleware verifies sw_session (fast, edge-compatible via jose).
 * Server components call getSession() to read the same cookie.
 * Backend API calls attach sw_access_token via getAccessToken().
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

export const SESSION_COOKIE  = "sw_session";
export const ACCESS_COOKIE   = "sw_access_token";
export const REFRESH_COOKIE  = "sw_refresh_token";

const SESSION_DAYS           = 7;   // matches backend REFRESH_TOKEN_EXPIRE_DAYS
const ACCESS_TOKEN_SECONDS   = 24 * 3600;    // 24 h
const REFRESH_TOKEN_SECONDS  = 7 * 24 * 3600; // 7 d

function secret(): Uint8Array {
  const key = process.env.AUTH_SECRET ?? "soilwatch-dev-secret-change-in-production";
  return new TextEncoder().encode(key);
}

const isProd = process.env.NODE_ENV === "production";

// ── Session payload (stored in sw_session, signed by Next.js) ────────────

export interface SessionPayload {
  userId:   string;
  email:    string;
  fullName: string;
  role:     string; // role name from backend, e.g. "admin" | "user"
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DAYS}d`)
    .setIssuedAt()
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ── Read session (server components / layouts) ────────────────────────────

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// Edge-compatible (middleware) — reads from the request directly
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// ── Read backend tokens (server components / API routes) ─────────────────

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}

// ── Cookie option builders ────────────────────────────────────────────────

export async function sessionCookieOptions(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  return { name: SESSION_COOKIE, value: token, httpOnly: true, secure: isProd, sameSite: "lax" as const, maxAge: SESSION_DAYS * 24 * 3600, path: "/" };
}

export function accessCookieOptions(token: string) {
  return { name: ACCESS_COOKIE, value: token, httpOnly: true, secure: isProd, sameSite: "lax" as const, maxAge: ACCESS_TOKEN_SECONDS, path: "/" };
}

export function refreshCookieOptions(token: string) {
  return { name: REFRESH_COOKIE, value: token, httpOnly: true, secure: isProd, sameSite: "lax" as const, maxAge: REFRESH_TOKEN_SECONDS, path: "/" };
}

export function clearCookieOptions(name: string) {
  return { name, value: "", httpOnly: true, secure: isProd, sameSite: "lax" as const, maxAge: 0, path: "/" };
}
