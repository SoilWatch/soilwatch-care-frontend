import BiocharDashboard from "./BiocharDashboard";
import { loadBiocharData } from "./ona";

export default async function BiocharPage() {
  const dataSource = await loadBiocharData();
  return <BiocharDashboard dataSource={dataSource} />;
}
