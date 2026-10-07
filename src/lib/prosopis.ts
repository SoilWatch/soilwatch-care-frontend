export type ProsopisKind = "highConfidence" | "confidence";
export type ProsopisCompareMode = "none" | "model" | "kind";
export interface ProsopisVersion {
  id: string;
  label: string;
  filename: string;
  kind: ProsopisKind;
  coverage: "south" | "all";
  resolution: 10 | 100;
  color: [number, number, number];
}

export const PROSOPIS_VERSIONS: ProsopisVersion[] = [
  { model: "v22", prefix: "Afar_Prosopis_v22", coverage: "south", resolution: 10 },
  { model: "v22_distRoads", prefix: "Afar_Prosopis_v22_distRoads", coverage: "south", resolution: 10 },
  { model: "v22_distRoads", prefix: "All_Afar_Prosopis_100m_v22_distRoads", coverage: "all", resolution: 100 },
].flatMap(({ model, prefix, coverage, resolution }) =>
  (["highConfidence", "confidence"] as const).map(kind => ({
    id: `${prefix}_${kind}`,
    label: model,
    filename: `${prefix}_${kind}.tif`,
    kind,
    coverage: coverage as "south" | "all",
    resolution: resolution as 10 | 100,
    color: [139, 0, 0] as [number, number, number],
  })),
);

export const CONFIDENCE_PALETTE = ["#ffffcc", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"];
const RGB_PALETTE = CONFIDENCE_PALETTE.map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));

export function prosopisPixel(value: number, noDataValue: number | null, kind: ProsopisKind): [number, number, number, number] {
  if (!Number.isFinite(value) || value === noDataValue) return [0, 0, 0, 0];
  if (kind === "highConfidence") return value === 1 ? [139, 0, 0, 255] : [0, 0, 0, 0];
  if (value < 0.1) return [0, 0, 0, 0];
  // CUBIC overviews in the supplied probability exports can overshoot 1.
  const position = Math.min(1, value) * (RGB_PALETTE.length - 1);
  const low = Math.floor(position);
  const high = Math.min(low + 1, RGB_PALETTE.length - 1);
  const fraction = position - low;
  const rgb = RGB_PALETTE[low].map((v, i) => Math.round(v + (RGB_PALETTE[high][i] - v) * fraction));
  return [rgb[0], rgb[1], rgb[2], 255];
}
