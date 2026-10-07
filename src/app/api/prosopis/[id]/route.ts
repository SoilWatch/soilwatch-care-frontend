import { GoogleAuth } from "google-auth-library";
import { getSession } from "@/lib/auth";
import { PROSOPIS_VERSIONS } from "@/lib/prosopis";

export const runtime = "nodejs";
const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/devstorage.read_only"] });
const MAX_RANGE_BYTES = 32 * 1024 * 1024;

// Only known objects are exposed, and only to authenticated dashboard users.
// ADC uses local application credentials or the Cloud Run service identity.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const layer = PROSOPIS_VERSIONS.find(layer => layer.id === id);
  if (!layer) return new Response("Unknown layer", { status: 404 });
  const range = request.headers.get("range");
  const match = range?.match(/^bytes=(\d+)-(\d+)$/);
  if (!match) return new Response("A bounded byte range is required", { status: 416 });
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end < start || end - start + 1 > MAX_RANGE_BYTES) {
    return new Response("Invalid byte range", { status: 416 });
  }
  try {
    const token = await auth.getAccessToken();
    if (!token) throw new Error("Missing GCS credentials");
    const upstream = await fetch(`https://storage.googleapis.com/soilwatch-gee/${layer.filename}`, {
      headers: { Authorization: `Bearer ${token}`, Range: range! },
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    if (upstream.status !== 206) {
      await upstream.body?.cancel();
      return new Response("Raster unavailable", { status: upstream.status === 416 ? 416 : 502 });
    }
    const headers = new Headers({ "Content-Type": "image/tiff", "Cache-Control": "private, max-age=3600", "Accept-Ranges": "bytes" });
    for (const name of ["content-range", "content-length", "etag"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(upstream.body, { status: 206, headers });
  } catch {
    return new Response("Raster unavailable; check server GCS access", { status: 502 });
  }
}
