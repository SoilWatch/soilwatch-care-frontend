import { NextResponse } from "next/server";
import { getUserByEmail, createUser } from "@/lib/users";
import { isAllowedDomain, getAllowedDomains } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const confirm = typeof body?.confirm === "string" ? body.confirm : "";

  if (!name) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  if (!email || !email.includes("@")) {
    const domains = getAllowedDomains().map(d => `@${d}`).join(", ");
    return NextResponse.json({ error: `Self-registration requires a ${domains} address.` }, { status: 400 });
  }
  if (!isAllowedDomain(email)) {
    const domains = getAllowedDomains().map(d => `@${d}`).join(", ");
    return NextResponse.json({
      error: `Self-registration is only available for ${domains} addresses. Contact your administrator.`,
    }, { status: 403 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (password !== confirm) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }
  if (getUserByEmail(email)) {
    return NextResponse.json({ error: "An account with this email already exists. Try signing in." }, { status: 409 });
  }

  createUser(email, name, password, "user");
  return NextResponse.json({ ok: true });
}
