// regain.ts — regain_kiln_operator (simplified per-burn kiln log), a second
// ONA form merged into the same combined batch view as biochar_batch.
// Mirrors field-manager-dashboard's regain_loader.py + the pd.concat merge
// in sync.load_combined_df_from_db(): regain rows are adapted into full
// Batch objects (missing CSI fields defaulted, never fabricated as
// compliant) so every downstream KPI/tab/chart consumes one array with no
// per-source special-casing. See REGAIN_MAPPING.md in that repo for the
// full field-mapping rationale.

import type { Batch, VisualQuality } from "./data";

export interface RegainRecord {
  batch_id: string;
  today: string | null;
  production_date: string | null;
  operator_name: string;
  device_id: string;
  kiln_number: string;
  kiln_id: string;
  production_lat: number | null;
  production_lon: number | null;
  baskets_in: number | null;
  quench_method: string;
  buckets_out: number | null;
  sample_collected: boolean;
  photo_feedstock_pile: string | null;
  photo_active_pyrolysis: string | null;
  photo_biochar_output: string | null;
  submission_time: string;
  form_version: string;
  instance_id: string;
  ona_id: number | null;
}

export interface RegainDataSource {
  records: RegainRecord[];
  source: "ona" | "db";
  formId?: string;
  error?: string;
  loadedAt: string;
}

// Adapts a regain_kiln_operator record into a full Batch object. Fields the
// regain form doesn't collect (feedstock weight/moisture, visual quality,
// pyrolysis duration, safety) get neutral/failing defaults rather than being
// fabricated as compliant — regain rows legitimately fail most CSI
// requirements, which is an accurate reflection of what the form captures,
// not a scoring bug (same call field-manager-dashboard made).
export function regainToBatch(r: RegainRecord): Batch {
  const productionDate = r.production_date || r.today || "1970-01-01";
  const sampleCollected = r.sample_collected;
  const lag = Math.max(
    0,
    Math.floor((new Date(r.submission_time).getTime() - new Date(productionDate).getTime()) / 86400000),
  );
  const submissionLagDays = Number.isFinite(lag) ? lag : 0;
  const pf = r.photo_feedstock_pile?.startsWith("http") ?? false;
  const pa = r.photo_active_pyrolysis?.startsWith("http") ?? false;
  const pb = r.photo_biochar_output?.startsWith("http") ?? false;
  const ps = false; // regain has no sample-bag photo field

  const c_feedstock_weight = false;
  const c_feedstock_moisture = false;
  const c_biochar_weight = false;
  const c_visual_quality = false;
  const c_no_safety_incidents = true; // regain doesn't collect safety data — assume none reported
  const c_duration_in_range = false; // regain doesn't collect duration
  const c_operator_certified = true; // placeholder, same as biochar_batch
  const hard = [c_feedstock_weight, c_feedstock_moisture, c_biochar_weight, c_visual_quality,
    sampleCollected, c_no_safety_incidents, c_duration_in_range, c_operator_certified, pf, pb, ps];
  const compliance_fails = hard.filter((v) => !v).length;

  const visual_quality: VisualQuality = "poor";

  return {
    data_source: "regain_kiln_operator",
    batch_id: r.batch_id,
    batch_seq: 0,
    kiln_id: r.kiln_id || "unknown_kiln",
    operator_name: r.operator_name || "Unknown operator",
    recorder_name: r.operator_name || "Unknown operator",
    feedstock_type: "",
    feedstock_appearance: "dry",
    feedstock_volume_m3: 0,
    feedstock_weight_kg: null,
    feedstock_drying_days: 0,
    feedstock_piece_size: "",
    feedstock_source_desc: "",
    feedstock_tracking_id: "",
    feedstock_lat: r.production_lat ?? 0,
    feedstock_lon: r.production_lon ?? 0,
    production_date: productionDate,
    production_lat: r.production_lat ?? 0,
    production_lon: r.production_lon ?? 0,
    quench_method: r.quench_method ?? "",
    num_feed_cycles: 0,
    weather_conditions: "",
    wind_shield_used: false,
    temp_sensor_installed: false,
    temp_peak_c: null,
    temp_avg_c: null,
    temp_duration_above_500: null,
    biochar_visual_quality: visual_quality,
    biochar_wet_weight_kg: 0,
    biochar_volume_l: null,
    sample_collected: sampleCollected,
    sample_id: null,
    uncharred_separated: false,
    smoke_observation: "none",
    safety_incidents: "none",
    safety_details: "",
    operational_issues: "",
    batch_notes: `Simplified kiln log — baskets in: ${r.baskets_in ?? "?"}, buckets out: ${r.buckets_out ?? "?"}`,
    pyrolysis_duration_min: 0,
    feeding_duration_min: 0,
    yield_ratio_pct: null,
    form_version: r.form_version || "unknown",
    submission_time: r.submission_time,
    media_expected: null,
    media_received: null,
    photo_feedstock_pile: r.photo_feedstock_pile,
    photo_active_pyrolysis: r.photo_active_pyrolysis,
    photo_biochar_output: r.photo_biochar_output,
    photo_sample_bag: null,
    dry_kg: 0,
    submission_lag_days: submissionLagDays,
    photo_feedstock_pile_ok: pf,
    photo_active_pyrolysis_ok: pa,
    photo_biochar_output_ok: pb,
    photo_sample_bag_ok: ps,
    photos_captured: [pf, pa, pb].filter(Boolean).length,
    csi_photos_captured: [pf, pb].filter(Boolean).length,
    quality_score: 1,
    c_feedstock_weight,
    c_feedstock_moisture,
    c_feedstock_dryness: false,
    c_biochar_weight,
    c_visual_quality,
    c_quality_acceptable: false,
    c_sample_collected: sampleCollected,
    c_no_safety_incidents,
    c_duration_in_range,
    c_operator_certified,
    c_photo_feedstock: pf,
    c_photo_biochar: pb,
    c_photo_sample_bag: ps,
    c_temp_data: false,
    csi_compliant: compliance_fails === 0,
    compliance_fails,
  };
}
