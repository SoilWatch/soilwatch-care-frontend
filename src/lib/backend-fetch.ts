const BACKEND_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";
const SERVICE_EMAIL = process.env.FASTAPI_SERVICE_EMAIL;
const SERVICE_PASSWORD = process.env.FASTAPI_SERVICE_PASSWORD;

let cachedToken: string | null = null;

async function login(): Promise<string | null> {
  if (!SERVICE_EMAIL || !SERVICE_PASSWORD) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: SERVICE_EMAIL, password: SERVICE_PASSWORD }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    cachedToken = typeof data?.access_token === "string" ? data.access_token : null;
    return cachedToken;
  } catch {
    return null;
  }
}

export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const send = (token: string | null) =>
    fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let token = cachedToken ?? (await login());
  let res = await send(token);
  if (res.status === 401) {
    token = await login();
    res = await send(token);
  }
  return res;
}
