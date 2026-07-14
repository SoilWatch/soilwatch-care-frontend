/**
 * JWT session utilities. Mirrors auth.py session and domain logic.
 * Cookie: sw_session (httpOnly, SameSite=Lax)
 */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "sw_session";
const ALLOWED_DOMAINS = ["soilwatch.eu", "care.org", "care.et"];
const SESSION_DAYS = 7;

function secret(): Uint8Array {
  const key = process.env.AUTH_SECRET ?? "soilwatch-dev-secret-change-in-production";
  return new TextEncoder().encode(key);
}

export interface SessionPayload {
  email: string;
  name: string;
  role: "admin" | "user";
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

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_DAYS * 24 * 3600,
    path: "/",
  };
}

export function clearCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
}

export function getAllowedDomains(): string[] {
  const env = process.env.ALLOWED_DOMAINS;
  if (env) return env.split(",").map(d => d.trim().toLowerCase().replace(/^@/, ""));
  return ALLOWED_DOMAINS;
}

export function isAllowedDomain(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1] ?? "";
  return getAllowedDomains().includes(domain);
}
