import { getDb, ensureSchema } from "@/lib/db";

const ONA_API_BASE = process.env.ONA_API_BASE ?? "https://api.ona.io/api/v1";
const CLEARANCE_FORM_ID = process.env.ONA_CLEARANCE_FORM_ID ?? "886132";

export interface ClearanceSite {
  site_id: string;
  polygon: GeoJSON.Polygon;
  submission_id: number; // ONA's _id / ona_id
  submission_time: string;
}

export interface ClearanceDataSource {
  sites: ClearanceSite[];
  formId: string;
  error?: string;
  loadedAt: string;
}

// ONA polygon format: "lat lon alt acc; lat lon alt acc; ..."
// Returns GeoJSON Polygon ([lon, lat] pairs) or null.
function parseOnaPolygon(raw: string): GeoJSON.Polygon | null {
  if (!raw?.trim()) return null;
  try {
    const coords = raw
      .split(";")
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => {
        const parts = s.split(/\s+/);
        return [parseFloat(parts[1]), parseFloat(parts[0])] as [number, number]; // [lon, lat]
      })
      .filter(([lon, lat]) => isFinite(lon) && isFinite(lat));

    if (coords.length < 3) return null;

    // Close the ring
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);

    return { type: "Polygon", coordinates: [coords] };
  } catch {
    return null;
  }
}

function centroid(polygon: GeoJSON.Polygon): [number, number] {
  const ring = polygon.coordinates[0];
  const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  const lon = ring.reduce((s, c) => s + c[0], 0) / ring.length;
  return [lat, lon]; // centroid_lat, centroid_lon
}

function parseSiteId(r: Record<string, unknown>): string {
  return String(
    r["site_id"] ?? r["g_site/site_id"] ?? r["g_id/site_id"] ?? r["_id"] ?? "unknown",
  );
}

async function readSitesFromDb(): Promise<ClearanceSite[] | null> {
  const sql = getDb();
  if (!sql) return null;
  try {
    await ensureSchema(sql);
    const rows = await sql`
      SELECT site_id, ona_id, polygon_raw, submission_time
      FROM clearance_sites
      ORDER BY submission_time DESC NULLS LAST
    `;
    return rows
      .map(r => {
        const polygon = parseOnaPolygon(String(r.polygon_raw ?? ""));
        if (!polygon) return null;
        return {
          site_id: r.site_id as string,
          polygon,
          submission_id: Number(r.ona_id ?? 0),
          submission_time: String(r.submission_time ?? ""),
        } satisfies ClearanceSite;
      })
      .filter((s): s is ClearanceSite => s !== null);
  } catch {
    return null;
  }
}

async function upsertSitesToDb(
  sites: ClearanceSite[],
  rawPolygonStrings: Map<string, string>, // site_id → original ONA polygon string
  rawRecords: Map<string, Record<string, unknown>>, // site_id → full ONA record
): Promise<void> {
  const sql = getDb();
  if (!sql || sites.length === 0) return;
  try {
    await ensureSchema(sql);
    const now = new Date().toISOString();
    await Promise.all(
      sites.map(s => {
        const [centLat, centLon] = centroid(s.polygon);
        const polygonRaw = rawPolygonStrings.get(s.site_id) ?? "";
        const raw = rawRecords.get(s.site_id) ?? {};
        return sql`
          INSERT INTO clearance_sites
            (site_id, ona_id, polygon_raw, centroid_lat, centroid_lon, submission_time, date,
             submitted_by, observer, cooperative, method, purity, density, synced_at)
          VALUES (
            ${s.site_id},
            ${s.submission_id},
            ${polygonRaw},
            ${centLat},
            ${centLon},
            ${s.submission_time || null},
            ${String(raw["date"] ?? "")},
            ${String(raw["submitted_by"] ?? raw["g_site/submitted_by"] ?? "")},
            ${String(raw["observer"] ?? raw["g_site/observer"] ?? "")},
            ${String(raw["cooperative"] ?? raw["g_site/cooperative"] ?? "")},
            ${String(raw["method"] ?? raw["g_site/method"] ?? "")},
            ${raw["purity"] !== undefined ? Number(raw["purity"]) : null},
            ${String(raw["density"] ?? raw["g_site/density"] ?? "")},
            ${now}
          )
          ON CONFLICT (site_id) DO UPDATE
            SET ona_id          = EXCLUDED.ona_id,
                polygon_raw     = EXCLUDED.polygon_raw,
                centroid_lat    = EXCLUDED.centroid_lat,
                centroid_lon    = EXCLUDED.centroid_lon,
                submission_time = EXCLUDED.submission_time,
                synced_at       = EXCLUDED.synced_at
        `;
      }),
    );
  } catch {
    // Non-fatal
  }
}

export async function loadClearanceData(): Promise<ClearanceDataSource> {
  const apiToken = process.env.ONA_API_TOKEN;

  if (!apiToken) {
    const db = await readSitesFromDb();
    return {
      sites: db ?? [],
      formId: CLEARANCE_FORM_ID,
      error: db ? undefined : "ONA_API_TOKEN is not configured.",
      loadedAt: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch(`${ONA_API_BASE}/data/${CLEARANCE_FORM_ID}.json`, {
      headers: { Authorization: `Token ${apiToken}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const db = await readSitesFromDb();
      return {
        sites: db ?? [],
        formId: CLEARANCE_FORM_ID,
        error: `ONA returned ${res.status} for clearance form ${CLEARANCE_FORM_ID}.`,
        loadedAt: new Date().toISOString(),
      };
    }

    const records = (await res.json()) as Record<string, unknown>[];

    const onaSites: ClearanceSite[] = [];
    const rawPolygonStrings = new Map<string, string>();
    const rawRecords = new Map<string, Record<string, unknown>>();

    for (const r of records) {
      const polygonRaw = String(r["g_site/polygon"] ?? "");
      const polygon = parseOnaPolygon(polygonRaw);
      if (!polygon) continue;
      const siteId = parseSiteId(r);
      rawPolygonStrings.set(siteId, polygonRaw);
      rawRecords.set(siteId, r);
      onaSites.push({
        site_id: siteId,
        polygon,
        submission_id: Number(r["_id"] ?? 0),
        submission_time: String(r["_submission_time"] ?? ""),
      });
    }

    await upsertSitesToDb(onaSites, rawPolygonStrings, rawRecords);

    // Read full historical set from DB; fall back to just-fetched ONA data
    const dbSites = await readSitesFromDb();
    return {
      sites: dbSites ?? onaSites,
      formId: CLEARANCE_FORM_ID,
      loadedAt: new Date().toISOString(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const db = await readSitesFromDb();
    return {
      sites: db ?? [],
      formId: CLEARANCE_FORM_ID,
      error: `Failed to fetch clearance data: ${message}`,
      loadedAt: new Date().toISOString(),
    };
  }
}
