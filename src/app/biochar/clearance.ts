import type { components } from "@/lib/api-types";
import { backendFetch } from "@/lib/backend-fetch";

// `polygon` is narrowed to GeoJSON.Polygon — the backend types it as a
// generic object since Pydantic doesn't model GeoJSON.
type BackendClearanceSite = components["schemas"]["ClearanceSite"];
type BackendClearanceResponse = components["schemas"]["ClearanceDataSourceResponse"];

export interface ClearanceSite extends Omit<BackendClearanceSite, "polygon"> {
  polygon: GeoJSON.Polygon;
}

export interface ClearanceDataSource extends Omit<BackendClearanceResponse, "sites"> {
  sites: ClearanceSite[];
}

export async function loadClearanceData(): Promise<ClearanceDataSource> {
  try {
    const res = await backendFetch("/api/clearance-sites", { cache: "no-store" });
    if (!res.ok) {
      return {
        sites: [],
        formId: "",
        error: `Backend returned ${res.status} ${res.statusText}.`,
        loadedAt: new Date().toISOString(),
      };
    }
    const data: BackendClearanceResponse = await res.json();
    return { ...data, sites: data.sites as unknown as ClearanceSite[] };
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
