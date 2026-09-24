import { getAccessToken, getRefreshToken } from "@/lib/auth";

const BACKEND_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const send = (token: string | undefined) =>
    fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  const token = await getAccessToken();
  let res = await send(token);

  if (res.status === 401) {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BACKEND_URL}/auth/refresh-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
          cache: "no-store",
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          res = await send(data.access_token);
        }
      } catch {
        // refresh failed — return the original 401
      }
    }
  }

  return res;
}
