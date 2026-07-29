const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

export interface ClearanceSite {
  site_id: string;
  polygon: GeoJSON.Polygon;
  submission_id: number;
  submission_time: string;
}

export interface ClearanceDataSource {
  sites: ClearanceSite[];
  formId: string;
  error?: string;
  loadedAt: string;
}

export async function loadClearanceData(): Promise<ClearanceDataSource> {
  try {
    const res = await fetch(`${FASTAPI_URL}/api/clearance-sites`, { cache: "no-store" });
    if (!res.ok) {
      return {
        sites: [],
        formId: "",
        error: `API returned ${res.status}`,
        loadedAt: new Date().toISOString(),
      };
    }
    return res.json() as Promise<ClearanceDataSource>;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      sites: [],
      formId: "",
      error: `Failed to reach API: ${message}`,
      loadedAt: new Date().toISOString(),
    };
  }
}
