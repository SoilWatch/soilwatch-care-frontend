import type { components } from "@/lib/api-types";
import { backendFetch } from "@/lib/backend-fetch";

type BackendFieldTrialSite = components["schemas"]["FieldTrialSite"];
type BackendFieldTrialResponse = components["schemas"]["FieldTrialDataSourceResponse"];

export interface FieldTrialSite extends Omit<BackendFieldTrialSite, "polygon"> {
  polygon: GeoJSON.Polygon;
}

export interface FieldTrialDataSource extends Omit<BackendFieldTrialResponse, "sites"> {
  sites: FieldTrialSite[];
}

export async function loadFieldTrialData(): Promise<FieldTrialDataSource> {
  try {
    const res = await backendFetch("/api/field-trials", { cache: "no-store" });
    if (!res.ok) {
      return {
        sites: [],
        formId: "",
        error: `Backend returned ${res.status} ${res.statusText}.`,
        loadedAt: new Date().toISOString(),
      };
    }
    const data: BackendFieldTrialResponse = await res.json();
    return { ...data, sites: data.sites as unknown as FieldTrialSite[] };
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
