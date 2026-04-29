import BiocharDashboard from "./BiocharDashboard";
import { parseBiocharCsv } from "./data";
import { readFile } from "node:fs/promises";
import path from "node:path";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export default async function BiocharPage() {
  const csvPath = path.join(process.cwd(), "field-manager-dashboard", "sample_data.csv");
  const csv = await readFile(csvPath, "utf8");
  const batches = parseBiocharCsv(csv);

  return <BiocharDashboard mapboxToken={MAPBOX_TOKEN} batches={batches} />;
}
