import BiocharDashboard from "./BiocharDashboard";
import { loadBiocharData } from "./ona";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export const dynamic = "force-dynamic";

export default async function BiocharPage() {
  const dataSource = await loadBiocharData();

  return <BiocharDashboard mapboxToken={MAPBOX_TOKEN} dataSource={dataSource} />;
}
