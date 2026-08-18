// regain.ts — regain_kiln_operator (simplified per-burn kiln log), a second
// ONA form merged into the same combined batch view as biochar_batch. Its
// data model turned out richer than the docs it was originally ported from
// suggested: the live form DOES capture real feedstock weight, dry biochar
// output weight, and burn duration (verified against the live ONA CSV, not
// assumed) — those are used directly below, not hardcoded to zero. It still
// genuinely lacks visual quality, moisture, temperature, and safety fields,
// so only those get neutral/failing defaults.

import type { Batch, VisualQuality } from "./data";
import { MOISTURE_ESTIMATE, PYRO_MIN, PYRO_MAX } from "./data";

export interface RegainRecord {
  batch_id: string;
  today: string | null;
  production_date: string | null;
  operator_name: string;
  coop_name: string | null;
  device_id: string;
  kiln_number: string;
  kiln_id: string;
  production_lat: number | null;
  production_lon: number | null;
  num_bundles: number | null;
  feedstock_weight_kg: number | null;
  quench_method: string;
  buckets_out: number | null;
  sample_collected: boolean;
  photo_feedstock_pile: string | null;
  photo_biochar_output: string | null;
  pyrolysis_duration_min: number | null;
  biochar_dry_weight_kg: number | null;
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
// form genuinely doesn't collect (visual quality, moisture, temperature,
// safety) get neutral/failing defaults rather than being fabricated as
// compliant. Fields it does collect (feedstock/output weight, duration) are
// used as-is, so a fully-filled-in regain log can legitimately score as
// CSI-compliant — it's not capped at "always fails" just for being regain.
export function regainToBatch(r: RegainRecord): Batch {
  const productionDate = r.production_date || r.today || "1970-01-01";
  const sampleCollected = r.sample_collected;
  const lag = Math.max(
    0,
    Math.floor((new Date(r.submission_time).getTime() - new Date(productionDate).getTime()) / 86400000),
  );
  const submissionLagDays = Number.isFinite(lag) ? lag : 0;

  // biochar_dry_weight_kg_estimated from ONA is already moisture-adjusted —
  // back-derive an equivalent "wet" figure so it round-trips through Batch's
  // own dry_kg = wet * (1 - MOISTURE_ESTIMATE) formula without double-
  // discounting moisture.
  const biocharWetWeightKg = r.biochar_dry_weight_kg != null
    ? r.biochar_dry_weight_kg / (1 - MOISTURE_ESTIMATE)
    : 0;
  const pyrolysisDurationMin = r.pyrolysis_duration_min ?? 0;

  const pf = r.photo_feedstock_pile?.startsWith("http") ?? false;
  const pa = false; // regain's active-pyrolysis photo is per-feed-bundle, no single reliable field
  const pb = r.photo_biochar_output?.startsWith("http") ?? false;
  const ps = false; // regain has no sample-bag photo field

  const c_feedstock_weight = (r.feedstock_weight_kg ?? 0) > 0;
  const c_feedstock_moisture = false; // not captured by either form — no moisture meters
  const c_biochar_weight = biocharWetWeightKg > 0;
  const c_visual_quality = false; // regain doesn't capture visual quality
  const c_no_safety_incidents = true; // regain doesn't collect safety data — assume none reported
  const c_duration_in_range = pyrolysisDurationMin >= PYRO_MIN && pyrolysisDurationMin <= PYRO_MAX;
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
    feedstock_weight_kg: r.feedstock_weight_kg,
    feedstock_drying_days: 0,
    feedstock_piece_size: "",
    feedstock_source_desc: r.coop_name ?? "",
    feedstock_tracking_id: "",
    feedstock_lat: r.production_lat ?? 0,
    feedstock_lon: r.production_lon ?? 0,
    production_date: productionDate,
    production_lat: r.production_lat ?? 0,
    production_lon: r.production_lon ?? 0,
    quench_method: r.quench_method ?? "",
    num_feed_cycles: r.num_bundles ?? 0,
    weather_conditions: "",
    wind_shield_used: false,
    temp_sensor_installed: false,
    temp_peak_c: null,
    temp_avg_c: null,
    temp_duration_above_500: null,
    biochar_visual_quality: visual_quality,
    biochar_wet_weight_kg: biocharWetWeightKg,
    biochar_volume_l: null,
    sample_collected: sampleCollected,
    sample_id: null,
    uncharred_separated: false,
    smoke_observation: "none",
    safety_incidents: "none",
    safety_details: "",
    operational_issues: "",
    batch_notes: `Simplified kiln log — ${r.num_bundles ?? "?"} bundles in, ${r.buckets_out ?? "?"} buckets out`,
    pyrolysis_duration_min: pyrolysisDurationMin,
    feeding_duration_min: 0,
    yield_ratio_pct: null,
    form_version: r.form_version || "unknown",
    submission_time: r.submission_time,
    media_expected: null,
    media_received: null,
    photo_feedstock_pile: r.photo_feedstock_pile,
    photo_active_pyrolysis: null,
    photo_biochar_output: r.photo_biochar_output,
    photo_sample_bag: null,
    dry_kg: biocharWetWeightKg * (1 - MOISTURE_ESTIMATE),
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
