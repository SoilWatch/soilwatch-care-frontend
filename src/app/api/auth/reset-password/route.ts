import { NextResponse } from "next/server";

const BACKEND = process.env.FASTAPI_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token        = typeof body?.token        === "string" ? body.token.trim()    : "";
  const new_password = typeof body?.new_password === "string" ? body.new_password    : "";

  if (!token || !new_password) {
    return NextResponse.json({ error: "Token and new password are required." }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password }),
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable. Please try again later." }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data.detail === "string" ? data.detail : "Invalid or expired reset link.";
    return NextResponse.json({ error: detail }, { status: res.status });
  }

  return NextResponse.json({ message: data.message ?? "Password reset successful." });
}
