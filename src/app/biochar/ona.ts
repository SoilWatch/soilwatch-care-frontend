import { parseBiocharCsv, type Batch } from "./data";
import { type RegainRecord, regainToBatch } from "./regain";
import { getDb, ensureSchema } from "@/lib/db";

const ONA_API_BASE = process.env.ONA_API_BASE ?? "https://api.ona.io/api/v1";
const ONA_REGAIN_FORM_ID = process.env.ONA_REGAIN_FORM_ID ?? "";

export interface BiocharDataSource {
  batches: Batch[];
  source: "ona" | "db";
  formId?: string;
  error?: string;
  loadedAt: string;
}

async function readBatchesFromDb(formId: string): Promise<Batch[] | null> {
  const sql = getDb();
  if (!sql) return null;
  try {
    await ensureSchema(sql);
    const rows = await sql`
      SELECT data FROM biochar_batches
      ORDER BY (data->>'production_date') DESC NULLS LAST
    `;
    return rows.map(r => r.data as Batch);
  } catch {
    return null;
  }
}

async function upsertBatchesToDb(batches: Batch[], formId: string): Promise<void> {
  const sql = getDb();
  if (!sql || batches.length === 0) return;
  try {
    await ensureSchema(sql);
    await Promise.all(
      batches.map(batch =>
        sql`
          INSERT INTO biochar_batches (batch_id, form_id, data, synced_at)
          VALUES (${batch.batch_id}, ${formId}, ${JSON.stringify(batch)}::jsonb, NOW())
          ON CONFLICT (batch_id) DO UPDATE
            SET form_id   = EXCLUDED.form_id,
                data      = EXCLUDED.data,
                synced_at = NOW()
        `,
      ),
    );
  } catch {
    // DB write failure is non-fatal — ONA data still returned
  }
}

const REGAIN_COLUMN_MAP: Record<string, string> = {
  "lot_id": "batch_id",
  "today": "today",
  "username": "operator_name",
  "p1_start/kiln_number": "kiln_number",
  "p1_start/kiln_id": "kiln_id",
  "_production_gps_latitude": "production_lat",
  "_production_gps_longitude": "production_lon",
  "p2_feed/num_bundles": "num_bundles",
  "p2_feed/total_feedstock_weight_kg_measured": "feedstock_weight_kg",
  "p2_burn/photo_feedstock_pile": "photo_feedstock_pile",
  "p2_burn/quench_method": "quench_method",
  "p3_quench/photo_biochar_output": "photo_biochar_output",
  "p3_quench/buckets_out": "buckets_out",
  "p4_sample/subsample_done": "sample_collected",
  "burn_minutes": "pyrolysis_duration_min",
  "biochar_dry_weight_kg_estimated": "biochar_dry_weight_kg",
  "_submission_time": "submission_time",
  "_version": "form_version",
  "_id": "ona_id",
  "meta/instanceID": "instance_id",
  "deviceid": "device_id",
};

function parseRegainCsv(text: string): RegainRecord[] {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, ""));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(",").map(v => v.replace(/^"|"$/g, ""));
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => { raw[h] = values[i] ?? ""; });
    const get = (key: string): string => {
      const alias = Object.entries(REGAIN_COLUMN_MAP).find(([, a]) => a === key)?.[0];
      return (alias ? raw[alias] : undefined) ?? raw[key] ?? "";
    };
    const toNum = (v: string) => { const n = parseFloat(v); return isFinite(n) ? n : null; };
    const toBool = (v: string) => ["yes", "true", "1", "yes_collected"].includes(v.toLowerCase().trim());
    return {
      batch_id: get("batch_id") || `regain-${get("ona_id") || Math.random()}`,
      today: get("today") || null,
      production_date: get("today") || null,
      operator_name: get("operator_name") || "Unknown",
      coop_name: null,
      device_id: get("device_id"),
      kiln_number: get("kiln_number"),
      kiln_id: (get("kiln_id") || "").toLowerCase().replace(/-/g, "_"),
      production_lat: toNum(get("production_lat")),
      production_lon: toNum(get("production_lon")),
      num_bundles: toNum(get("num_bundles")),
      feedstock_weight_kg: toNum(get("feedstock_weight_kg")),
      quench_method: get("quench_method"),
      buckets_out: toNum(get("buckets_out")),
      sample_collected: toBool(get("sample_collected")),
      photo_feedstock_pile: get("photo_feedstock_pile").startsWith("http") ? get("photo_feedstock_pile") : null,
      photo_biochar_output: get("photo_biochar_output").startsWith("http") ? get("photo_biochar_output") : null,
      pyrolysis_duration_min: toNum(get("pyrolysis_duration_min")),
      biochar_dry_weight_kg: toNum(get("biochar_dry_weight_kg")),
      submission_time: get("submission_time"),
      form_version: get("form_version") || "unknown",
      instance_id: get("instance_id"),
      ona_id: toNum(get("ona_id")) as number | null,
    } satisfies RegainRecord;
  });
}

async function loadRegainBatches(): Promise<Batch[]> {
  if (!ONA_REGAIN_FORM_ID || !process.env.ONA_API_TOKEN) return [];
  try {
    const res = await fetch(`${ONA_API_BASE}/data/${ONA_REGAIN_FORM_ID}.csv`, {
      headers: { Authorization: `Token ${process.env.ONA_API_TOKEN}` },
    });
    if (!res.ok) return [];
    const csv = await res.text();
    return parseRegainCsv(csv).map(regainToBatch);
  } catch {
    return [];
  }
}

export async function loadBiocharData(): Promise<BiocharDataSource> {
  const formId = process.env.ONA_FORM_ID;
  const apiToken = process.env.ONA_API_TOKEN;

  if (!formId || !apiToken) {
    const dbBatches = await readBatchesFromDb("");
    if (dbBatches && dbBatches.length > 0) {
      return { batches: dbBatches, source: "db", loadedAt: new Date().toISOString() };
    }
    return {
      batches: [],
      source: "ona",
      error: "ONA_FORM_ID or ONA_API_TOKEN is not configured.",
      loadedAt: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch(`${ONA_API_BASE}/data/${formId}.csv`, {
      headers: { Authorization: `Token ${apiToken}` },
    });

    if (response.status === 401) {
      const db = await readBatchesFromDb(formId);
      return { batches: db ?? [], source: db ? "db" : "ona", formId, error: "ONA rejected the configured API token.", loadedAt: new Date().toISOString() };
    }
    if (response.status === 403) {
      const db = await readBatchesFromDb(formId);
      return { batches: db ?? [], source: db ? "db" : "ona", formId, error: `The configured token cannot access ONA form ${formId}.`, loadedAt: new Date().toISOString() };
    }
    if (response.status === 404) {
      const db = await readBatchesFromDb(formId);
      return { batches: db ?? [], source: db ? "db" : "ona", formId, error: `ONA form ${formId} was not found.`, loadedAt: new Date().toISOString() };
    }
    if (!response.ok) {
      const db = await readBatchesFromDb(formId);
      return { batches: db ?? [], source: db ? "db" : "ona", formId, error: `ONA returned ${response.status} ${response.statusText}.`, loadedAt: new Date().toISOString() };
    }

    const csv = await response.text();
    const onaBatches = parseBiocharCsv(csv);

    await upsertBatchesToDb(onaBatches, formId);

    const [dbBatches, regainBatches] = await Promise.all([
      readBatchesFromDb(formId),
      loadRegainBatches(),
    ]);
    const tagged = (dbBatches ?? onaBatches).map(b => ({ ...b, data_source: "biochar_batch" as const }));
    return {
      batches: [...tagged, ...regainBatches].sort((a, b) => b.production_date.localeCompare(a.production_date)),
      source: dbBatches ? "db" : "ona",
      formId,
      loadedAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ONA fetch error.";
    const [db, regainBatches] = await Promise.all([
      readBatchesFromDb(formId),
      loadRegainBatches(),
    ]);
    const tagged = (db ?? []).map(b => ({ ...b, data_source: "biochar_batch" as const }));
    return {
      batches: [...tagged, ...regainBatches].sort((a, b) => b.production_date.localeCompare(a.production_date)),
      source: db ? "db" : "ona",
      formId,
      error: `Failed to fetch ONA data: ${message}`,
      loadedAt: new Date().toISOString(),
    };
  }
}
