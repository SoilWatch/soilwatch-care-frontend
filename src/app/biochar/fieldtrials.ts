const ONA_API_BASE = process.env.ONA_API_BASE ?? "https://api.ona.io/api/v1";
const FIELD_TRIAL_FORM_ID = process.env.ONA_FIELD_TRIAL_FORM_ID ?? "891006";

export interface FieldTrialSite {
  site_id: string;
  polygon: GeoJSON.Polygon;
  submission_id: number;
  submission_time: string;
}

export interface FieldTrialDataSource {
  sites: FieldTrialSite[];
  formId: string;
  error?: string;
  loadedAt: string;
}

function parseOnaPolygon(raw: string): GeoJSON.Polygon | null {
  if (!raw?.trim()) return null;
  try {
    const coords = raw
      .split(";")
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => {
        const parts = s.split(/\s+/);
        return [parseFloat(parts[1]), parseFloat(parts[0])] as [number, number];
      })
      .filter(([lon, lat]) => isFinite(lon) && isFinite(lat));
    if (coords.length < 3) return null;
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);
    return { type: "Polygon", coordinates: [coords] };
  } catch {
    return null;
  }
}

function extractPolygon(r: Record<string, unknown>): { raw: string; polygon: GeoJSON.Polygon } | null {
  // Try common ONA polygon field names
  const candidates = [
    "polygon", "location", "gps", "plot_polygon", "trial_polygon",
    "g_trial/polygon", "g_site/polygon", "g_plot/polygon",
  ];
  for (const key of candidates) {
    const raw = String(r[key] ?? "");
    const polygon = parseOnaPolygon(raw);
    if (polygon) return { raw, polygon };
  }
  // Last resort: scan all string values for something that looks like an ONA polygon
  for (const [, val] of Object.entries(r)) {
    if (typeof val !== "string") continue;
    const polygon = parseOnaPolygon(val);
    if (polygon) return { raw: val, polygon };
  }
  return null;
}

function parseSiteId(r: Record<string, unknown>, index: number): string {
  return String(
    r["site_id"] ?? r["trial_id"] ?? r["plot_id"] ?? r["g_trial/site_id"] ?? r["_id"] ?? `trial-${index + 1}`,
  );
}

export async function loadFieldTrialData(): Promise<FieldTrialDataSource> {
  const apiToken = process.env.ONA_API_TOKEN;

  if (!apiToken) {
    return {
      sites: [],
      formId: FIELD_TRIAL_FORM_ID,
      error: "ONA_API_TOKEN is not configured.",
      loadedAt: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch(`${ONA_API_BASE}/data/${FIELD_TRIAL_FORM_ID}.json`, {
      headers: { Authorization: `Token ${apiToken}` },
    });

    if (!res.ok) {
      return {
        sites: [],
        formId: FIELD_TRIAL_FORM_ID,
        error: `ONA returned ${res.status} for field trial form ${FIELD_TRIAL_FORM_ID}.`,
        loadedAt: new Date().toISOString(),
      };
    }

    const records = (await res.json()) as Record<string, unknown>[];
    const sites: FieldTrialSite[] = [];

    records.forEach((r, i) => {
      const result = extractPolygon(r);
      if (!result) return;
      sites.push({
        site_id: parseSiteId(r, i),
        polygon: result.polygon,
        submission_id: Number(r["_id"] ?? 0),
        submission_time: String(r["_submission_time"] ?? ""),
      });
    });

    return { sites, formId: FIELD_TRIAL_FORM_ID, loadedAt: new Date().toISOString() };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      sites: [],
      formId: FIELD_TRIAL_FORM_ID,
      error: `Failed to fetch field trial data: ${message}`,
      loadedAt: new Date().toISOString(),
    };
  }
}
