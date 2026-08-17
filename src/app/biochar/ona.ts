import type { Batch } from "./data";
import type { RegainDataSource } from "./regain";
import { regainToBatch } from "./regain";

const BACKEND_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

export interface BiocharDataSource {
  batches: Batch[];
  source: "ona" | "db";
  formId?: string;
  error?: string;
  loadedAt: string;
}

async function fetchBatches(): Promise<BiocharDataSource> {
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
    const data: BiocharDataSource = await res.json();
    return { ...data, batches: data.batches ?? [] };
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

async function fetchRegainRecords(): Promise<Batch[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/regain-records`, { cache: "no-store" });
    if (!res.ok) return [];
    const data: RegainDataSource = await res.json();
    return (data.records ?? []).map(regainToBatch);
  } catch (err) {
    // regain sync is best-effort — never block the main dashboard, but log
    // so a real bug (e.g. a regainToBatch throw, not just a network error)
    // doesn't silently vanish as "no regain data".
    console.error("regain-records fetch/adapt failed:", err);
    return [];
  }
}

// Merges biochar_batch and regain_kiln_operator into one array, tagged by
// data_source, before any KPI/tab/chart code runs — same architecture as
// field-manager-dashboard's load_combined_df_from_db(), one level up (here
// vs. there) since this backend already keeps both forms in one shared
// table (see soilwatch-care-api's app/services/ona_sync.py).
export async function loadBiocharData(): Promise<BiocharDataSource> {
  const [base, regainBatches] = await Promise.all([fetchBatches(), fetchRegainRecords()]);

  const taggedBatches = base.batches.map((b) => ({ ...b, data_source: "biochar_batch" as const }));

  return {
    ...base,
    batches: [...taggedBatches, ...regainBatches].sort((a, b) => b.production_date.localeCompare(a.production_date)),
  };
}
