import { parseBiocharCsv, type Batch } from "./data";
import { getDb, ensureSchema } from "@/lib/db";

const ONA_API_BASE = process.env.ONA_API_BASE ?? "https://api.ona.io/api/v1";

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

    const dbBatches = await readBatchesFromDb(formId);
    return {
      batches: (dbBatches ?? onaBatches).sort((a, b) => b.production_date.localeCompare(a.production_date)),
      source: dbBatches ? "db" : "ona",
      formId,
      loadedAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ONA fetch error.";
    const db = await readBatchesFromDb(formId);
    return {
      batches: (db ?? []).sort((a, b) => b.production_date.localeCompare(a.production_date)),
      source: db ? "db" : "ona",
      formId,
      error: `Failed to fetch ONA data: ${message}`,
      loadedAt: new Date().toISOString(),
    };
  }
}
