import type { Batch } from "./data";

const BACKEND_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

export interface BiocharDataSource {
  batches: Batch[];
  source: "ona" | "db";
  formId?: string;
  error?: string;
  loadedAt: string;
}

export async function loadBiocharData(): Promise<BiocharDataSource> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/batches`, { cache: "no-store" });
    if (!res.ok) {
      return {
        batches: [],
        source: "ona",
        error: `Backend returned ${res.status} ${res.statusText}.`,
        loadedAt: new Date().toISOString(),
      };
    }
    return res.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      batches: [],
      source: "ona",
      error: `Failed to reach backend: ${message}`,
      loadedAt: new Date().toISOString(),
    };
  }
}
