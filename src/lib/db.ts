import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

let _sql: Sql | null = null;

export function getDb(): Sql | null {
  if (!process.env.DATABASE_URL) return null;
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

// Idempotent — safe to call on every request.
// clearance_sites schema matches the existing Streamlit-created table exactly.
export async function ensureSchema(sql: Sql): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS biochar_batches (
      batch_id  TEXT PRIMARY KEY,
      form_id   TEXT NOT NULL DEFAULT '',
      data      JSONB NOT NULL,
      synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  // Matches the existing Streamlit-seeded schema (polygon stored as raw ONA text,
  // centroid stored as separate lat/lon reals, synced_at/submission_time as text).
  await sql`
    CREATE TABLE IF NOT EXISTS clearance_sites (
      site_id         TEXT PRIMARY KEY,
      ona_id          INTEGER,
      polygon_raw     TEXT NOT NULL DEFAULT '',
      centroid_lat    REAL,
      centroid_lon    REAL,
      submission_time TEXT,
      date            TEXT,
      submitted_by    TEXT,
      observer        TEXT,
      cooperative     TEXT,
      method          TEXT,
      purity          INTEGER,
      density         TEXT,
      synced_at       TEXT NOT NULL DEFAULT ''
    )
  `;
}
