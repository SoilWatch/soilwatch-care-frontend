import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const ONA_API_TOKEN = process.env.ONA_API_TOKEN ?? "";
const ALLOWED_HOST  = "api.ona.io";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorised", { status: 401 });

  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return new NextResponse("Missing url param", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  // SSRF guard — only proxy requests to ONA
  if (parsed.hostname !== ALLOWED_HOST || parsed.protocol !== "https:") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), {
      headers: { Authorization: `Token ${ONA_API_TOKEN}` },
      cache: "no-store",
    });
  } catch {
    return new NextResponse("Failed to reach ONA", { status: 502 });
  }

  if (!upstream.ok) {
    return new NextResponse("ONA returned " + upstream.status, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  const body = await upstream.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // Cache for 24 h — photo content never changes for a given submission
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
