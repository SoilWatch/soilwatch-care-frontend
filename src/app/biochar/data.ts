// ── Constants ──────────────────────────────────────────────────────────────
export const PYRO_MIN = 60;
export const PYRO_MAX = 240;
export const ACTIVE_WINDOW_DAYS = 14;
export const COMPLIANCE_WINDOW_DAYS = 30;
export const MOISTURE_ESTIMATE = 0.15;

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

export interface KilnSite {
  kiln_id: string;
  label: string;
  location: string;
  lat: number;
  lon: number;
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

// ── Kiln sites ─────────────────────────────────────────────────────────────
export const KILN_SITES: KilnSite[] = [
  { kiln_id: "K-01", label: "Kiln 01 — Dubti", location: "Dubti, Afar", lat: 11.5545, lon: 40.1478 },
  { kiln_id: "K-02", label: "Kiln 02 — Asaita", location: "Asaita, Afar", lat: 11.6072, lon: 40.1921 },
];

// ── Helper — compute compliance flags ─────────────────────────────────────
function makeBatch(raw: {
  batch_id: string; batch_seq: number; kiln_id: string; operator_name: string;
  recorder_name: string; feedstock_type: string; feedstock_appearance: FeedstockAppearance;
  feedstock_volume_m3: number; feedstock_drying_days: number; feedstock_piece_size: string;
  feedstock_source_desc: string; feedstock_tracking_id: string;
  feedstock_lat: number; feedstock_lon: number;
  production_date: string; production_lat: number; production_lon: number;
  quench_method: string; num_feed_cycles: number; weather_conditions: string;
  wind_shield_used: boolean; biochar_visual_quality: VisualQuality;
  biochar_wet_weight_kg: number; biochar_volume_l: number;
  sample_collected: boolean; sample_id: string | null; uncharred_separated: boolean;
  smoke_observation: SmokeLevel; safety_incidents: string; safety_details: string;
  operational_issues: string; batch_notes: string;
  pyrolysis_duration_min: number; feeding_duration_min: number;
  form_version: string; submission_time: string;
  media_expected: number; media_received: number;
  photo_feedstock_pile: string | null; photo_active_pyrolysis: string | null;
  photo_biochar_output: string | null; photo_sample_bag: string | null;
}): Batch {
  const qualMap: Record<VisualQuality, number> = { excellent: 4, good: 3, fair: 2, poor: 1 };
  const pf = raw.photo_feedstock_pile?.startsWith("http") ?? false;
  const pa = raw.photo_active_pyrolysis?.startsWith("http") ?? false;
  const pb = raw.photo_biochar_output?.startsWith("http") ?? false;
  const ps = raw.photo_sample_bag?.startsWith("http") ?? false;

  const c_feedstock_weight = false; // no scales yet
  const c_feedstock_moisture = false; // no moisture meters
  const c_feedstock_dryness = !!raw.feedstock_appearance;
  const c_biochar_weight = raw.biochar_wet_weight_kg > 0;
  const c_visual_quality = !!raw.biochar_visual_quality;
  const c_quality_acceptable = raw.biochar_visual_quality === "excellent" || raw.biochar_visual_quality === "good";
  const c_sample_collected = raw.sample_collected;
  const c_no_safety_incidents = raw.safety_incidents.toLowerCase() === "none";
  const c_duration_in_range = raw.pyrolysis_duration_min >= PYRO_MIN && raw.pyrolysis_duration_min <= PYRO_MAX;
  const c_operator_certified = true;
  const c_temp_data = false;

  const hard = [c_feedstock_weight, c_feedstock_moisture, c_biochar_weight, c_visual_quality,
    c_sample_collected, c_no_safety_incidents, c_duration_in_range, c_operator_certified, pf, pb, ps];
  const compliance_fails = hard.filter(v => !v).length;

  const prodDate = new Date(raw.production_date);
  const subDate = new Date(raw.submission_time);
  const lag = Math.max(0, Math.floor((subDate.getTime() - prodDate.getTime()) / 86400000));

  return {
    ...raw,
    feedstock_weight_kg: null,
    yield_ratio_pct: null,
    temp_sensor_installed: false,
    temp_peak_c: null,
    temp_avg_c: null,
    temp_duration_above_500: null,
    dry_kg: raw.biochar_wet_weight_kg * (1 - MOISTURE_ESTIMATE),
    submission_lag_days: lag,
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

const ONA = "https://ona.io/soilwatch/forms/biochar_cp2/";

// ── Mock batch records — most recent first ─────────────────────────────────
export const MOCK_BATCHES: Batch[] = [
  makeBatch({
    batch_id: "B-2026-022", batch_seq: 22, kiln_id: "K-01", operator_name: "Ahmed Ibrahim",
    recorder_name: "Ahmed Ibrahim", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "dry", feedstock_volume_m3: 1.8, feedstock_drying_days: 7,
    feedstock_piece_size: "medium", feedstock_source_desc: "Afar riverbank clearing",
    feedstock_tracking_id: "FS-2026-022", feedstock_lat: 11.551, feedstock_lon: 40.141,
    production_date: "2026-04-25", production_lat: 11.5545, production_lon: 40.1478,
    quench_method: "water", num_feed_cycles: 4, weather_conditions: "sunny",
    wind_shield_used: true, biochar_visual_quality: "excellent",
    biochar_wet_weight_kg: 48.5, biochar_volume_l: 62,
    sample_collected: true, sample_id: "S-2026-022", uncharred_separated: true,
    smoke_observation: "minimal", safety_incidents: "none", safety_details: "",
    operational_issues: "none", batch_notes: "Good run, kiln temperature stable throughout.",
    pyrolysis_duration_min: 155, feeding_duration_min: 42,
    form_version: "v2.3", submission_time: "2026-04-25T16:30:00Z",
    media_expected: 4, media_received: 4,
    photo_feedstock_pile: `${ONA}submissions/022/photo_feedstock.jpg`,
    photo_active_pyrolysis: `${ONA}submissions/022/photo_pyrolysis.jpg`,
    photo_biochar_output: `${ONA}submissions/022/photo_biochar.jpg`,
    photo_sample_bag: `${ONA}submissions/022/photo_sample.jpg`,
  }),
  makeBatch({
    batch_id: "B-2026-021", batch_seq: 21, kiln_id: "K-01", operator_name: "Mohammed Yusuf",
    recorder_name: "Mohammed Yusuf", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "mostly_dry", feedstock_volume_m3: 1.5, feedstock_drying_days: 5,
    feedstock_piece_size: "medium", feedstock_source_desc: "Eastern field clearing",
    feedstock_tracking_id: "FS-2026-021", feedstock_lat: 11.558, feedstock_lon: 40.152,
    production_date: "2026-04-18", production_lat: 11.5545, production_lon: 40.1478,
    quench_method: "water", num_feed_cycles: 3, weather_conditions: "cloudy",
    wind_shield_used: false, biochar_visual_quality: "good",
    biochar_wet_weight_kg: 39.2, biochar_volume_l: 51,
    sample_collected: true, sample_id: "S-2026-021", uncharred_separated: true,
    smoke_observation: "moderate", safety_incidents: "none", safety_details: "",
    operational_issues: "none", batch_notes: "",
    pyrolysis_duration_min: 130, feeding_duration_min: 38,
    form_version: "v2.3", submission_time: "2026-04-19T08:15:00Z",
    media_expected: 4, media_received: 3,
    photo_feedstock_pile: `${ONA}submissions/021/photo_feedstock.jpg`,
    photo_active_pyrolysis: `${ONA}submissions/021/photo_pyrolysis.jpg`,
    photo_biochar_output: `${ONA}submissions/021/photo_biochar.jpg`,
    photo_sample_bag: null,
  }),
  makeBatch({
    batch_id: "B-2026-020", batch_seq: 20, kiln_id: "K-02", operator_name: "Fatima Hassan",
    recorder_name: "Fatima Hassan", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "dry", feedstock_volume_m3: 2.1, feedstock_drying_days: 10,
    feedstock_piece_size: "large", feedstock_source_desc: "Asaita north clearing",
    feedstock_tracking_id: "FS-2026-020", feedstock_lat: 11.612, feedstock_lon: 40.196,
    production_date: "2026-04-10", production_lat: 11.6072, production_lon: 40.1921,
    quench_method: "water", num_feed_cycles: 5, weather_conditions: "sunny",
    wind_shield_used: true, biochar_visual_quality: "excellent",
    biochar_wet_weight_kg: 56.0, biochar_volume_l: 72,
    sample_collected: true, sample_id: "S-2026-020", uncharred_separated: true,
    smoke_observation: "none", safety_incidents: "none", safety_details: "",
    operational_issues: "none", batch_notes: "Highest output this month.",
    pyrolysis_duration_min: 175, feeding_duration_min: 55,
    form_version: "v2.3", submission_time: "2026-04-10T17:00:00Z",
    media_expected: 4, media_received: 4,
    photo_feedstock_pile: `${ONA}submissions/020/photo_feedstock.jpg`,
    photo_active_pyrolysis: `${ONA}submissions/020/photo_pyrolysis.jpg`,
    photo_biochar_output: `${ONA}submissions/020/photo_biochar.jpg`,
    photo_sample_bag: `${ONA}submissions/020/photo_sample.jpg`,
  }),
  makeBatch({
    batch_id: "B-2026-019", batch_seq: 19, kiln_id: "K-02", operator_name: "Ali Osman",
    recorder_name: "Ali Osman", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "mostly_dry", feedstock_volume_m3: 1.6, feedstock_drying_days: 5,
    feedstock_piece_size: "medium", feedstock_source_desc: "Asaita south road",
    feedstock_tracking_id: "FS-2026-019", feedstock_lat: 11.601, feedstock_lon: 40.188,
    production_date: "2026-04-03", production_lat: 11.6072, production_lon: 40.1921,
    quench_method: "water", num_feed_cycles: 3, weather_conditions: "windy",
    wind_shield_used: true, biochar_visual_quality: "good",
    biochar_wet_weight_kg: 41.3, biochar_volume_l: 54,
    sample_collected: false, sample_id: null, uncharred_separated: false,
    smoke_observation: "moderate", safety_incidents: "none", safety_details: "",
    operational_issues: "Wind made temperature control difficult in first hour.",
    batch_notes: "",
    pyrolysis_duration_min: 120, feeding_duration_min: 35,
    form_version: "v2.3", submission_time: "2026-04-04T09:00:00Z",
    media_expected: 3, media_received: 3,
    photo_feedstock_pile: `${ONA}submissions/019/photo_feedstock.jpg`,
    photo_active_pyrolysis: null,
    photo_biochar_output: `${ONA}submissions/019/photo_biochar.jpg`,
    photo_sample_bag: null,
  }),
  makeBatch({
    batch_id: "B-2026-018", batch_seq: 18, kiln_id: "K-01", operator_name: "Ahmed Ibrahim",
    recorder_name: "Ahmed Ibrahim", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "partially_wet", feedstock_volume_m3: 1.4, feedstock_drying_days: 3,
    feedstock_piece_size: "small", feedstock_source_desc: "Dubti irrigation canal area",
    feedstock_tracking_id: "FS-2026-018", feedstock_lat: 11.548, feedstock_lon: 40.144,
    production_date: "2026-03-28", production_lat: 11.5545, production_lon: 40.1478,
    quench_method: "water", num_feed_cycles: 3, weather_conditions: "sunny",
    wind_shield_used: false, biochar_visual_quality: "fair",
    biochar_wet_weight_kg: 28.7, biochar_volume_l: 38,
    sample_collected: true, sample_id: "S-2026-018", uncharred_separated: false,
    smoke_observation: "heavy", safety_incidents: "none", safety_details: "",
    operational_issues: "Feedstock was wetter than expected — some uncharred material at base.",
    batch_notes: "Will increase drying period next run.",
    pyrolysis_duration_min: 95, feeding_duration_min: 28,
    form_version: "v2.3", submission_time: "2026-03-29T10:30:00Z",
    media_expected: 4, media_received: 2,
    photo_feedstock_pile: `${ONA}submissions/018/photo_feedstock.jpg`,
    photo_active_pyrolysis: null,
    photo_biochar_output: `${ONA}submissions/018/photo_biochar.jpg`,
    photo_sample_bag: null,
  }),
  makeBatch({
    batch_id: "B-2026-017", batch_seq: 17, kiln_id: "K-02", operator_name: "Fatima Hassan",
    recorder_name: "Fatima Hassan", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "dry", feedstock_volume_m3: 1.9, feedstock_drying_days: 8,
    feedstock_piece_size: "medium", feedstock_source_desc: "Asaita north clearing",
    feedstock_tracking_id: "FS-2026-017", feedstock_lat: 11.614, feedstock_lon: 40.198,
    production_date: "2026-03-21", production_lat: 11.6072, production_lon: 40.1921,
    quench_method: "water", num_feed_cycles: 4, weather_conditions: "sunny",
    wind_shield_used: true, biochar_visual_quality: "excellent",
    biochar_wet_weight_kg: 52.1, biochar_volume_l: 67,
    sample_collected: true, sample_id: "S-2026-017", uncharred_separated: true,
    smoke_observation: "minimal", safety_incidents: "none", safety_details: "",
    operational_issues: "none", batch_notes: "Best run this month.",
    pyrolysis_duration_min: 168, feeding_duration_min: 48,
    form_version: "v2.3", submission_time: "2026-03-21T15:45:00Z",
    media_expected: 4, media_received: 4,
    photo_feedstock_pile: `${ONA}submissions/017/photo_feedstock.jpg`,
    photo_active_pyrolysis: `${ONA}submissions/017/photo_pyrolysis.jpg`,
    photo_biochar_output: `${ONA}submissions/017/photo_biochar.jpg`,
    photo_sample_bag: `${ONA}submissions/017/photo_sample.jpg`,
  }),
  makeBatch({
    batch_id: "B-2026-016", batch_seq: 16, kiln_id: "K-01", operator_name: "Mohammed Yusuf",
    recorder_name: "Mohammed Yusuf", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "mostly_dry", feedstock_volume_m3: 1.7, feedstock_drying_days: 6,
    feedstock_piece_size: "medium", feedstock_source_desc: "Dubti road clearing",
    feedstock_tracking_id: "FS-2026-016", feedstock_lat: 11.560, feedstock_lon: 40.154,
    production_date: "2026-03-14", production_lat: 11.5545, production_lon: 40.1478,
    quench_method: "sand", num_feed_cycles: 4, weather_conditions: "cloudy",
    wind_shield_used: false, biochar_visual_quality: "good",
    biochar_wet_weight_kg: 43.8, biochar_volume_l: 57,
    sample_collected: true, sample_id: "S-2026-016", uncharred_separated: true,
    smoke_observation: "minimal", safety_incidents: "none", safety_details: "",
    operational_issues: "none", batch_notes: "",
    pyrolysis_duration_min: 142, feeding_duration_min: 40,
    form_version: "v2.3", submission_time: "2026-03-14T14:00:00Z",
    media_expected: 4, media_received: 4,
    photo_feedstock_pile: `${ONA}submissions/016/photo_feedstock.jpg`,
    photo_active_pyrolysis: `${ONA}submissions/016/photo_pyrolysis.jpg`,
    photo_biochar_output: `${ONA}submissions/016/photo_biochar.jpg`,
    photo_sample_bag: `${ONA}submissions/016/photo_sample.jpg`,
  }),
  makeBatch({
    batch_id: "B-2026-015", batch_seq: 15, kiln_id: "K-01", operator_name: "Ahmed Ibrahim",
    recorder_name: "Ahmed Ibrahim", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "dry", feedstock_volume_m3: 2.0, feedstock_drying_days: 9,
    feedstock_piece_size: "large", feedstock_source_desc: "Afar riverbank clearing",
    feedstock_tracking_id: "FS-2026-015", feedstock_lat: 11.549, feedstock_lon: 40.140,
    production_date: "2026-03-07", production_lat: 11.5545, production_lon: 40.1478,
    quench_method: "water", num_feed_cycles: 5, weather_conditions: "sunny",
    wind_shield_used: true, biochar_visual_quality: "excellent",
    biochar_wet_weight_kg: 55.3, biochar_volume_l: 71,
    sample_collected: true, sample_id: "S-2026-015", uncharred_separated: true,
    smoke_observation: "none", safety_incidents: "none", safety_details: "",
    operational_issues: "none", batch_notes: "Kiln performed well.",
    pyrolysis_duration_min: 190, feeding_duration_min: 52,
    form_version: "v2.3", submission_time: "2026-03-07T16:00:00Z",
    media_expected: 4, media_received: 4,
    photo_feedstock_pile: `${ONA}submissions/015/photo_feedstock.jpg`,
    photo_active_pyrolysis: `${ONA}submissions/015/photo_pyrolysis.jpg`,
    photo_biochar_output: `${ONA}submissions/015/photo_biochar.jpg`,
    photo_sample_bag: `${ONA}submissions/015/photo_sample.jpg`,
  }),
  makeBatch({
    batch_id: "B-2026-014", batch_seq: 14, kiln_id: "K-02", operator_name: "Ali Osman",
    recorder_name: "Ali Osman", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "partially_wet", feedstock_volume_m3: 1.3, feedstock_drying_days: 2,
    feedstock_piece_size: "small", feedstock_source_desc: "Asaita west road",
    feedstock_tracking_id: "FS-2026-014", feedstock_lat: 11.604, feedstock_lon: 40.183,
    production_date: "2026-03-01", production_lat: 11.6072, production_lon: 40.1921,
    quench_method: "water", num_feed_cycles: 3, weather_conditions: "overcast",
    wind_shield_used: false, biochar_visual_quality: "fair",
    biochar_wet_weight_kg: 31.5, biochar_volume_l: 41,
    sample_collected: false, sample_id: null, uncharred_separated: false,
    smoke_observation: "heavy", safety_incidents: "none", safety_details: "",
    operational_issues: "Moisture in feedstock caused excessive smoke in first 30 minutes.",
    batch_notes: "Operator requested additional drying guidance.",
    pyrolysis_duration_min: 85, feeding_duration_min: 25,
    form_version: "v2.3", submission_time: "2026-03-03T07:30:00Z",
    media_expected: 3, media_received: 2,
    photo_feedstock_pile: `${ONA}submissions/014/photo_feedstock.jpg`,
    photo_active_pyrolysis: null,
    photo_biochar_output: `${ONA}submissions/014/photo_biochar.jpg`,
    photo_sample_bag: null,
  }),
  makeBatch({
    batch_id: "B-2026-013", batch_seq: 13, kiln_id: "K-02", operator_name: "Fatima Hassan",
    recorder_name: "Fatima Hassan", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "dry", feedstock_volume_m3: 1.8, feedstock_drying_days: 7,
    feedstock_piece_size: "medium", feedstock_source_desc: "Asaita north clearing",
    feedstock_tracking_id: "FS-2026-013", feedstock_lat: 11.611, feedstock_lon: 40.195,
    production_date: "2026-02-22", production_lat: 11.6072, production_lon: 40.1921,
    quench_method: "water", num_feed_cycles: 4, weather_conditions: "sunny",
    wind_shield_used: true, biochar_visual_quality: "good",
    biochar_wet_weight_kg: 47.6, biochar_volume_l: 61,
    sample_collected: true, sample_id: "S-2026-013", uncharred_separated: true,
    smoke_observation: "minimal", safety_incidents: "none", safety_details: "",
    operational_issues: "none", batch_notes: "",
    pyrolysis_duration_min: 158, feeding_duration_min: 44,
    form_version: "v2.2", submission_time: "2026-02-22T17:00:00Z",
    media_expected: 4, media_received: 4,
    photo_feedstock_pile: `${ONA}submissions/013/photo_feedstock.jpg`,
    photo_active_pyrolysis: `${ONA}submissions/013/photo_pyrolysis.jpg`,
    photo_biochar_output: `${ONA}submissions/013/photo_biochar.jpg`,
    photo_sample_bag: `${ONA}submissions/013/photo_sample.jpg`,
  }),
  makeBatch({
    batch_id: "B-2026-012", batch_seq: 12, kiln_id: "K-01", operator_name: "Mohammed Yusuf",
    recorder_name: "Mohammed Yusuf", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "mostly_dry", feedstock_volume_m3: 1.6, feedstock_drying_days: 5,
    feedstock_piece_size: "medium", feedstock_source_desc: "Eastern field clearing",
    feedstock_tracking_id: "FS-2026-012", feedstock_lat: 11.556, feedstock_lon: 40.150,
    production_date: "2026-02-15", production_lat: 11.5545, production_lon: 40.1478,
    quench_method: "water", num_feed_cycles: 3, weather_conditions: "windy",
    wind_shield_used: true, biochar_visual_quality: "poor",
    biochar_wet_weight_kg: 24.1, biochar_volume_l: 31,
    sample_collected: true, sample_id: "S-2026-012", uncharred_separated: false,
    smoke_observation: "very_heavy", safety_incidents: "none", safety_details: "",
    operational_issues: "Strong wind disrupted pyrolysis — temperature dropped significantly mid-run.",
    batch_notes: "Suggest postponing production on windy days.",
    pyrolysis_duration_min: 46, feeding_duration_min: 20,
    form_version: "v2.2", submission_time: "2026-02-16T08:00:00Z",
    media_expected: 4, media_received: 3,
    photo_feedstock_pile: `${ONA}submissions/012/photo_feedstock.jpg`,
    photo_active_pyrolysis: null,
    photo_biochar_output: `${ONA}submissions/012/photo_biochar.jpg`,
    photo_sample_bag: null,
  }),
  makeBatch({
    batch_id: "B-2026-011", batch_seq: 11, kiln_id: "K-01", operator_name: "Ahmed Ibrahim",
    recorder_name: "Ahmed Ibrahim", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "dry", feedstock_volume_m3: 1.9, feedstock_drying_days: 8,
    feedstock_piece_size: "medium", feedstock_source_desc: "Afar riverbank clearing",
    feedstock_tracking_id: "FS-2026-011", feedstock_lat: 11.550, feedstock_lon: 40.142,
    production_date: "2026-02-08", production_lat: 11.5545, production_lon: 40.1478,
    quench_method: "water", num_feed_cycles: 4, weather_conditions: "sunny",
    wind_shield_used: true, biochar_visual_quality: "good",
    biochar_wet_weight_kg: 46.2, biochar_volume_l: 59,
    sample_collected: true, sample_id: "S-2026-011", uncharred_separated: true,
    smoke_observation: "minimal", safety_incidents: "none", safety_details: "",
    operational_issues: "none", batch_notes: "",
    pyrolysis_duration_min: 148, feeding_duration_min: 41,
    form_version: "v2.2", submission_time: "2026-02-08T15:30:00Z",
    media_expected: 4, media_received: 4,
    photo_feedstock_pile: `${ONA}submissions/011/photo_feedstock.jpg`,
    photo_active_pyrolysis: `${ONA}submissions/011/photo_pyrolysis.jpg`,
    photo_biochar_output: `${ONA}submissions/011/photo_biochar.jpg`,
    photo_sample_bag: `${ONA}submissions/011/photo_sample.jpg`,
  }),
  makeBatch({
    batch_id: "B-2026-010", batch_seq: 10, kiln_id: "K-02", operator_name: "Ali Osman",
    recorder_name: "Ali Osman", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "mostly_dry", feedstock_volume_m3: 1.5, feedstock_drying_days: 5,
    feedstock_piece_size: "medium", feedstock_source_desc: "Asaita south road",
    feedstock_tracking_id: "FS-2026-010", feedstock_lat: 11.603, feedstock_lon: 40.186,
    production_date: "2026-02-01", production_lat: 11.6072, production_lon: 40.1921,
    quench_method: "water", num_feed_cycles: 3, weather_conditions: "sunny",
    wind_shield_used: false, biochar_visual_quality: "good",
    biochar_wet_weight_kg: 38.9, biochar_volume_l: 50,
    sample_collected: true, sample_id: "S-2026-010", uncharred_separated: true,
    smoke_observation: "moderate", safety_incidents: "none", safety_details: "",
    operational_issues: "none", batch_notes: "",
    pyrolysis_duration_min: 125, feeding_duration_min: 36,
    form_version: "v2.2", submission_time: "2026-02-02T10:00:00Z",
    media_expected: 4, media_received: 3,
    photo_feedstock_pile: `${ONA}submissions/010/photo_feedstock.jpg`,
    photo_active_pyrolysis: `${ONA}submissions/010/photo_pyrolysis.jpg`,
    photo_biochar_output: `${ONA}submissions/010/photo_biochar.jpg`,
    photo_sample_bag: null,
  }),
  makeBatch({
    batch_id: "B-2026-009", batch_seq: 9, kiln_id: "K-01", operator_name: "Mohammed Yusuf",
    recorder_name: "Mohammed Yusuf", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "dry", feedstock_volume_m3: 2.2, feedstock_drying_days: 10,
    feedstock_piece_size: "large", feedstock_source_desc: "Dubti road clearing",
    feedstock_tracking_id: "FS-2026-009", feedstock_lat: 11.562, feedstock_lon: 40.156,
    production_date: "2026-01-25", production_lat: 11.5545, production_lon: 40.1478,
    quench_method: "water", num_feed_cycles: 5, weather_conditions: "sunny",
    wind_shield_used: true, biochar_visual_quality: "excellent",
    biochar_wet_weight_kg: 59.8, biochar_volume_l: 77,
    sample_collected: true, sample_id: "S-2026-009", uncharred_separated: true,
    smoke_observation: "none", safety_incidents: "none", safety_details: "",
    operational_issues: "none", batch_notes: "Record output for K-01.",
    pyrolysis_duration_min: 210, feeding_duration_min: 58,
    form_version: "v2.2", submission_time: "2026-01-25T17:30:00Z",
    media_expected: 4, media_received: 4,
    photo_feedstock_pile: `${ONA}submissions/009/photo_feedstock.jpg`,
    photo_active_pyrolysis: `${ONA}submissions/009/photo_pyrolysis.jpg`,
    photo_biochar_output: `${ONA}submissions/009/photo_biochar.jpg`,
    photo_sample_bag: `${ONA}submissions/009/photo_sample.jpg`,
  }),
  makeBatch({
    batch_id: "B-2026-008", batch_seq: 8, kiln_id: "K-02", operator_name: "Fatima Hassan",
    recorder_name: "Fatima Hassan", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "dry", feedstock_volume_m3: 2.0, feedstock_drying_days: 9,
    feedstock_piece_size: "medium", feedstock_source_desc: "Asaita north clearing",
    feedstock_tracking_id: "FS-2026-008", feedstock_lat: 11.615, feedstock_lon: 40.200,
    production_date: "2026-01-18", production_lat: 11.6072, production_lon: 40.1921,
    quench_method: "water", num_feed_cycles: 4, weather_conditions: "sunny",
    wind_shield_used: true, biochar_visual_quality: "excellent",
    biochar_wet_weight_kg: 53.4, biochar_volume_l: 68,
    sample_collected: true, sample_id: "S-2026-008", uncharred_separated: true,
    smoke_observation: "none", safety_incidents: "none", safety_details: "",
    operational_issues: "none", batch_notes: "",
    pyrolysis_duration_min: 185, feeding_duration_min: 50,
    form_version: "v2.2", submission_time: "2026-01-18T16:00:00Z",
    media_expected: 4, media_received: 4,
    photo_feedstock_pile: `${ONA}submissions/008/photo_feedstock.jpg`,
    photo_active_pyrolysis: `${ONA}submissions/008/photo_pyrolysis.jpg`,
    photo_biochar_output: `${ONA}submissions/008/photo_biochar.jpg`,
    photo_sample_bag: `${ONA}submissions/008/photo_sample.jpg`,
  }),
  makeBatch({
    batch_id: "B-2026-007", batch_seq: 7, kiln_id: "K-01", operator_name: "Ahmed Ibrahim",
    recorder_name: "Ahmed Ibrahim", feedstock_type: "Prosopis juliflora",
    feedstock_appearance: "mostly_dry", feedstock_volume_m3: 1.6, feedstock_drying_days: 5,
    feedstock_piece_size: "medium", feedstock_source_desc: "Afar riverbank clearing",
    feedstock_tracking_id: "FS-2026-007", feedstock_lat: 11.552, feedstock_lon: 40.143,
    production_date: "2026-01-15", production_lat: 11.5545, production_lon: 40.1478,
    quench_method: "water", num_feed_cycles: 3, weather_conditions: "cloudy",
    wind_shield_used: false, biochar_visual_quality: "good",
    biochar_wet_weight_kg: 40.7, biochar_volume_l: 52,
    sample_collected: true, sample_id: "S-2026-007", uncharred_separated: true,
    smoke_observation: "moderate", safety_incidents: "none", safety_details: "",
    operational_issues: "none", batch_notes: "",
    pyrolysis_duration_min: 133, feeding_duration_min: 37,
    form_version: "v2.1", submission_time: "2026-01-16T09:00:00Z",
    media_expected: 4, media_received: 3,
    photo_feedstock_pile: `${ONA}submissions/007/photo_feedstock.jpg`,
    photo_active_pyrolysis: null,
    photo_biochar_output: `${ONA}submissions/007/photo_biochar.jpg`,
    photo_sample_bag: `${ONA}submissions/007/photo_sample.jpg`,
  }),
].sort((a, b) => new Date(b.production_date).getTime() - new Date(a.production_date).getTime());
