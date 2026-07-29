import type { Batch } from "./data";

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

export interface BiocharDataSource {
  batches: Batch[];
  source: "ona" | "db";
  formId?: string;
  error?: string;
  loadedAt: string;
}

export async function loadBiocharData(): Promise<BiocharDataSource> {
  try {
    const res = await fetch(`${FASTAPI_URL}/api/batches`, { cache: "no-store" });
    if (!res.ok) {
      return {
        batches: [],
        source: "ona",
        error: `API returned ${res.status}`,
        loadedAt: new Date().toISOString(),
      };
    }
    return res.json() as Promise<BiocharDataSource>;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      batches: [],
      source: "ona",
      error: `Failed to reach API: ${message}`,
      loadedAt: new Date().toISOString(),
    };
  }
}
