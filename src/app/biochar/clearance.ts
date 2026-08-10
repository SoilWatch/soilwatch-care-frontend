const BACKEND_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

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
    const res = await fetch(`${BACKEND_URL}/api/clearance-sites`, { cache: "no-store" });
    if (!res.ok) {
      return {
        sites: [],
        formId: "",
        error: `Backend returned ${res.status} ${res.statusText}.`,
        loadedAt: new Date().toISOString(),
      };
    }
    return res.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      sites: [],
      formId: "",
      error: `Failed to reach backend: ${message}`,
      loadedAt: new Date().toISOString(),
    };
  }
}
