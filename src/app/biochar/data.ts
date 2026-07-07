// ── Constants ──────────────────────────────────────────────────────────────
export const PYRO_MIN = 60;
export const PYRO_MAX = 240;
export const ACTIVE_WINDOW_DAYS = 14;
export const COMPLIANCE_WINDOW_DAYS = 30;
export const MOISTURE_ESTIMATE = 0.15;
export const SUBMISSION_LAG_SLA_DAYS = 3;

// ── Types ──────────────────────────────────────────────────────────────────
export type FeedstockAppearance = "dry" | "mostly_dry" | "partially_wet" | "wet";
export type VisualQuality = "excellent" | "good" | "fair" | "poor";
export type SmokeLevel = "none" | "minimal" | "moderate" | "heavy" | "very_heavy";

export interface Batch {
  batch_id: string;
  batch_seq: number;
  kiln_id: string;
  operator_name: string;
  recorder_name: string;
  feedstock_type: string;
  feedstock_appearance: FeedstockAppearance;
  feedstock_volume_m3: number;
  feedstock_weight_kg: number | null; // null until scales deployed
  feedstock_drying_days: number;
  feedstock_piece_size: string;
  feedstock_source_desc: string;
  feedstock_tracking_id: string;
  feedstock_lat: number;
  feedstock_lon: number;
  production_date: string; // YYYY-MM-DD
  production_lat: number;
  production_lon: number;
  quench_method: string;
  num_feed_cycles: number;
  weather_conditions: string;
  wind_shield_used: boolean;
  temp_sensor_installed: boolean;
  temp_peak_c: number | null;
  temp_avg_c: number | null;
  temp_duration_above_500: number | null;
  biochar_visual_quality: VisualQuality;
  biochar_wet_weight_kg: number;
  biochar_volume_l: number | null;
  sample_collected: boolean;
  sample_id: string | null;
  uncharred_separated: boolean;
  smoke_observation: SmokeLevel;
  safety_incidents: string;
  safety_details: string;
  operational_issues: string;
  batch_notes: string;
  pyrolysis_duration_min: number;
  feeding_duration_min: number;
  yield_ratio_pct: number | null; // null until scales
  form_version: string;
  submission_time: string; // ISO datetime
  media_expected: number | null;
  media_received: number | null;
  // Photo URLs (null = not captured)
  photo_feedstock_pile: string | null;
  photo_active_pyrolysis: string | null;
  photo_biochar_output: string | null;
  photo_sample_bag: string | null;
  // Computed fields
  dry_kg: number;
  submission_lag_days: number;
  photo_feedstock_pile_ok: boolean;
  photo_active_pyrolysis_ok: boolean;
  photo_biochar_output_ok: boolean;
  photo_sample_bag_ok: boolean;
  photos_captured: number;
  csi_photos_captured: number;
  quality_score: number; // 1=poor → 4=excellent
  // Compliance flags
  c_feedstock_weight: boolean;
  c_feedstock_moisture: boolean; // always false — no moisture meters
  c_feedstock_dryness: boolean;
  c_biochar_weight: boolean;
  c_visual_quality: boolean;
  c_quality_acceptable: boolean;
  c_sample_collected: boolean;
  c_no_safety_incidents: boolean;
  c_duration_in_range: boolean;
  c_operator_certified: boolean; // always true (placeholder)
  c_photo_feedstock: boolean;
  c_photo_biochar: boolean;
  c_photo_sample_bag: boolean;
  c_temp_data: boolean; // always false — no sensors
  csi_compliant: boolean;
  compliance_fails: number;
}

export const COLUMN_MAP: Record<string, string> = {
  "batch_id_group/batch_id": "batch_id",
  "batch_id_group/batch_seq": "batch_seq",
  "batch_id_group/kiln_id": "kiln_id",
  "batch_id_group/operator_name": "operator_name",
  "batch_id_group/recorder_name": "recorder_name",
  "feedstock_group/feedstock_type": "feedstock_type",
  "feedstock_group/feedstock_appearance": "feedstock_appearance",
  "feedstock_group/feedstock_volume_m3": "feedstock_volume_m3",
  "feedstock_group/feedstock_weight_kg": "feedstock_weight_kg",
  "feedstock_group/feedstock_drying_days": "feedstock_drying_days",
  "feedstock_group/feedstock_piece_size": "feedstock_piece_size",
  "feedstock_group/feedstock_source_desc": "feedstock_source_desc",
  "feedstock_group/feedstock_tracking_id": "feedstock_tracking_id",
  "feedstock_group/_feedstock_source_gps_latitude": "feedstock_lat",
  "feedstock_group/_feedstock_source_gps_longitude": "feedstock_lon",
  "feedstock_group/photo_feedstock_pile": "photo_feedstock_pile",
  "production_group/production_date": "production_date",
  "production_group/_production_gps_latitude": "production_lat",
  "production_group/_production_gps_longitude": "production_lon",
  "production_group/quench_method": "quench_method",
  "production_group/num_feed_cycles": "num_feed_cycles",
  "production_group/weather_conditions": "weather_conditions",
  "production_group/wind_shield_used": "wind_shield_used",
  "production_group/temp_sensor_installed": "temp_sensor_installed",
  "production_group/photo_active_pyrolysis": "photo_active_pyrolysis",
  "production_group/temp_group/temp_peak_c": "temp_peak_c",
  "production_group/temp_group/temp_avg_c": "temp_avg_c",
  "production_group/temp_group/temp_duration_above_500": "temp_duration_above_500",
  "output_group/biochar_visual_quality": "biochar_visual_quality",
  "output_group/biochar_wet_weight_kg": "biochar_wet_weight_kg",
  "output_group/biochar_volume_l": "biochar_volume_l",
  "output_group/sample_collected": "sample_collected",
  "output_group/sample_id": "sample_id",
  "output_group/uncharred_separated": "uncharred_separated",
  "output_group/photo_biochar_output": "photo_biochar_output",
  "output_group/photo_sample_bag": "photo_sample_bag",
  "safety_group/smoke_observation": "smoke_observation",
  "safety_group/safety_incidents": "safety_incidents",
  "safety_group/safety_details": "safety_details",
  "safety_group/operational_issues": "operational_issues",
  "safety_group/batch_notes": "batch_notes",
  "calc_group/pyrolysis_duration_min": "pyrolysis_duration_min",
  "calc_group/feeding_duration_min": "feeding_duration_min",
  "calc_group/yield_ratio_pct": "yield_ratio_pct",
  "_version": "form_version",
  "_submission_time": "submission_time",
  "_total_media": "media_expected",
  "_media_count": "media_received",
};

type CsvRecord = Record<string, string>;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  row.push(cell);
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function csvToRecords(text: string): CsvRecord[] {
  const rows = parseCsv(text);
  const header = rows[0] ?? [];
  return rows.slice(1).map((row) => {
    const record: CsvRecord = {};
    header.forEach((key, i) => {
      record[key] = row[i] ?? "";
    });
    return record;
  });
}

function aliased(record: CsvRecord, name: string): string {
  const originalKey = Object.entries(COLUMN_MAP).find(([, alias]) => alias === name)?.[0];
  return (originalKey ? record[originalKey] : undefined) ?? record[name] ?? "";
}

function cleanString(value: string | undefined, fallback = ""): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed || ["n/a", "nan", "null"].includes(trimmed.toLowerCase())) return fallback;
  return trimmed;
}

function toNumber(value: string | undefined): number | null {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDate(value: string | undefined): string {
  const cleaned = cleanString(value);
  if (!cleaned) return "";
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? cleaned.slice(0, 10) : parsed.toISOString().slice(0, 10);
}

function toIso(value: string | undefined, fallbackDate: string): string {
  const cleaned = cleanString(value);
  if (!cleaned) return `${fallbackDate}T00:00:00Z`;
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? `${fallbackDate}T00:00:00Z` : parsed.toISOString();
}

function isYes(value: string | undefined): boolean {
  return ["yes", "true", "1", "yes_collected", "collected", "yes_removed"].includes(cleanString(value).toLowerCase());
}

function urlOrNull(value: string | undefined): string | null {
  const cleaned = cleanString(value);
  return cleaned.startsWith("http") ? cleaned : null;
}

function normalizeFeedstockAppearance(value: string): FeedstockAppearance {
  const cleaned = cleanString(value, "dry") as FeedstockAppearance;
  return ["dry", "mostly_dry", "partially_wet", "wet"].includes(cleaned) ? cleaned : "dry";
}

function normalizeVisualQuality(value: string): VisualQuality {
  const cleaned = cleanString(value, "poor") as VisualQuality;
  return ["excellent", "good", "fair", "poor"].includes(cleaned) ? cleaned : "poor";
}

function normalizeSmoke(value: string): SmokeLevel {
  const cleaned = cleanString(value, "none") as SmokeLevel;
  return ["none", "minimal", "moderate", "heavy", "very_heavy"].includes(cleaned) ? cleaned : "none";
}

function withComputedFields(raw: Omit<Batch,
  "dry_kg" | "submission_lag_days" | "photo_feedstock_pile_ok" | "photo_active_pyrolysis_ok" |
  "photo_biochar_output_ok" | "photo_sample_bag_ok" | "photos_captured" | "csi_photos_captured" |
  "quality_score" | "c_feedstock_weight" | "c_feedstock_moisture" | "c_feedstock_dryness" |
  "c_biochar_weight" | "c_visual_quality" | "c_quality_acceptable" | "c_sample_collected" |
  "c_no_safety_incidents" | "c_duration_in_range" | "c_operator_certified" | "c_photo_feedstock" |
  "c_photo_biochar" | "c_photo_sample_bag" | "c_temp_data" | "csi_compliant" | "compliance_fails"
>): Batch {
  const qualMap: Record<VisualQuality, number> = { excellent: 4, good: 3, fair: 2, poor: 1 };
  const pf = raw.photo_feedstock_pile?.startsWith("http") ?? false;
  const pa = raw.photo_active_pyrolysis?.startsWith("http") ?? false;
  const pb = raw.photo_biochar_output?.startsWith("http") ?? false;
  const ps = raw.photo_sample_bag?.startsWith("http") ?? false;
  const c_feedstock_weight = (raw.feedstock_weight_kg ?? 0) > 0;
  const c_feedstock_moisture = false;
  const c_feedstock_dryness = !!raw.feedstock_appearance;
  const c_biochar_weight = raw.biochar_wet_weight_kg > 0;
  const c_visual_quality = !!raw.biochar_visual_quality;
  const c_quality_acceptable = raw.biochar_visual_quality === "excellent" || raw.biochar_visual_quality === "good";
  const c_sample_collected = raw.sample_collected;
  const c_no_safety_incidents = raw.safety_incidents.toLowerCase() === "none";
  const c_duration_in_range = raw.pyrolysis_duration_min >= PYRO_MIN && raw.pyrolysis_duration_min <= PYRO_MAX;
  const c_operator_certified = true;
  const c_temp_data = raw.temp_sensor_installed;
  const hard = [c_feedstock_weight, c_feedstock_moisture, c_biochar_weight, c_visual_quality,
    c_sample_collected, c_no_safety_incidents, c_duration_in_range, c_operator_certified, pf, pb, ps];
  const compliance_fails = hard.filter((value) => !value).length;
  const lag = Math.max(0, Math.floor((new Date(raw.submission_time).getTime() - new Date(raw.production_date).getTime()) / 86400000));

  return {
    ...raw,
    dry_kg: raw.biochar_wet_weight_kg * (1 - MOISTURE_ESTIMATE),
    submission_lag_days: Number.isFinite(lag) ? lag : 0,
    photo_feedstock_pile_ok: pf,
    photo_active_pyrolysis_ok: pa,
    photo_biochar_output_ok: pb,
    photo_sample_bag_ok: ps,
    photos_captured: [pf, pa, pb, ps].filter(Boolean).length,
    csi_photos_captured: [pf, pb, ps].filter(Boolean).length,
    quality_score: qualMap[raw.biochar_visual_quality],
    c_feedstock_weight,
    c_feedstock_moisture,
    c_feedstock_dryness,
    c_biochar_weight,
    c_visual_quality,
    c_quality_acceptable,
    c_sample_collected,
    c_no_safety_incidents,
    c_duration_in_range,
    c_operator_certified,
    c_photo_feedstock: pf,
    c_photo_biochar: pb,
    c_photo_sample_bag: ps,
    c_temp_data,
    csi_compliant: compliance_fails === 0,
    compliance_fails,
  };
}

export function parseBiocharCsv(text: string): Batch[] {
  return csvToRecords(text).map((record, index) => {
    const productionDate = toDate(aliased(record, "production_date")) || toDate(record.today) || "1970-01-01";
    return withComputedFields({
      batch_id: cleanString(aliased(record, "batch_id"), `batch-${index + 1}`),
      batch_seq: toNumber(aliased(record, "batch_seq")) ?? index + 1,
      kiln_id: cleanString(aliased(record, "kiln_id"), "unknown_kiln"),
      operator_name: cleanString(aliased(record, "operator_name"), "Unknown operator"),
      recorder_name: cleanString(aliased(record, "recorder_name"), "Unknown recorder"),
      feedstock_type: cleanString(aliased(record, "feedstock_type"), "prosopis"),
      feedstock_appearance: normalizeFeedstockAppearance(aliased(record, "feedstock_appearance")),
      feedstock_volume_m3: toNumber(aliased(record, "feedstock_volume_m3")) ?? 0,
      feedstock_weight_kg: toNumber(aliased(record, "feedstock_weight_kg")),
      feedstock_drying_days: toNumber(aliased(record, "feedstock_drying_days")) ?? 0,
      feedstock_piece_size: cleanString(aliased(record, "feedstock_piece_size")),
      feedstock_source_desc: cleanString(aliased(record, "feedstock_source_desc")),
      feedstock_tracking_id: cleanString(aliased(record, "feedstock_tracking_id")),
      feedstock_lat: toNumber(aliased(record, "feedstock_lat")) ?? 0,
      feedstock_lon: toNumber(aliased(record, "feedstock_lon")) ?? 0,
      production_date: productionDate,
      production_lat: toNumber(aliased(record, "production_lat")) ?? 0,
      production_lon: toNumber(aliased(record, "production_lon")) ?? 0,
      quench_method: cleanString(aliased(record, "quench_method")),
      num_feed_cycles: toNumber(aliased(record, "num_feed_cycles")) ?? 0,
      weather_conditions: cleanString(aliased(record, "weather_conditions")),
      wind_shield_used: isYes(aliased(record, "wind_shield_used")),
      temp_sensor_installed: isYes(aliased(record, "temp_sensor_installed")),
      temp_peak_c: toNumber(aliased(record, "temp_peak_c")),
      temp_avg_c: toNumber(aliased(record, "temp_avg_c")),
      temp_duration_above_500: toNumber(aliased(record, "temp_duration_above_500")),
      biochar_visual_quality: normalizeVisualQuality(aliased(record, "biochar_visual_quality")),
      biochar_wet_weight_kg: toNumber(aliased(record, "biochar_wet_weight_kg")) ?? 0,
      biochar_volume_l: toNumber(aliased(record, "biochar_volume_l")),
      sample_collected: isYes(aliased(record, "sample_collected")),
      sample_id: cleanString(aliased(record, "sample_id")) || null,
      uncharred_separated: isYes(aliased(record, "uncharred_separated")),
      smoke_observation: normalizeSmoke(aliased(record, "smoke_observation")),
      safety_incidents: cleanString(aliased(record, "safety_incidents"), "none"),
      safety_details: cleanString(aliased(record, "safety_details")),
      operational_issues: cleanString(aliased(record, "operational_issues"), "none"),
      batch_notes: cleanString(aliased(record, "batch_notes")),
      pyrolysis_duration_min: toNumber(aliased(record, "pyrolysis_duration_min")) ?? 0,
      feeding_duration_min: toNumber(aliased(record, "feeding_duration_min")) ?? 0,
      yield_ratio_pct: toNumber(aliased(record, "yield_ratio_pct")),
      form_version: cleanString(aliased(record, "form_version"), "unknown"),
      submission_time: toIso(aliased(record, "submission_time"), productionDate),
      media_expected: toNumber(aliased(record, "media_expected")),
      media_received: toNumber(aliased(record, "media_received")),
      photo_feedstock_pile: urlOrNull(aliased(record, "photo_feedstock_pile")),
      photo_active_pyrolysis: urlOrNull(aliased(record, "photo_active_pyrolysis")),
      photo_biochar_output: urlOrNull(aliased(record, "photo_biochar_output")),
      photo_sample_bag: urlOrNull(aliased(record, "photo_sample_bag")),
    });
  }).sort((a, b) => b.production_date.localeCompare(a.production_date));
}
