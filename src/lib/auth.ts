import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

export const SESSION_COOKIE  = "sw_session";
export const ACCESS_COOKIE   = "sw_access_token";
export const REFRESH_COOKIE  = "sw_refresh_token";

const COOKIE_NAME = "sw_session";
const SESSION_DAYS = 7;
const ACCESS_TOKEN_SECONDS = 15 * 60;

function secret(): Uint8Array {
  const key = process.env.AUTH_SECRET ?? "soilwatch-dev-secret-change-in-production";
  return new TextEncoder().encode(key);
}

const isProd = process.env.NODE_ENV === "production";

export interface SessionPayload {
  email: string;
  name:  string;
  role:  string; 
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
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}

export async function sessionCookieOptions(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  return { name: SESSION_COOKIE, value: token, httpOnly: true, secure: isProd, sameSite: "lax" as const, maxAge: SESSION_DAYS * 24 * 3600, path: "/" };
}

export function accessCookieOptions(token: string) {
  return { name: ACCESS_COOKIE, value: token, httpOnly: true, secure: isProd, sameSite: "lax" as const, maxAge: ACCESS_TOKEN_SECONDS, path: "/" };
}

