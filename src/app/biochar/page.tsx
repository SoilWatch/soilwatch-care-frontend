import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import { FlameKindling } from "lucide-react";

const batches = [
  {
    code: "SW-AFR-20260415-003",
    operator: "Amina Hassan",
    kiln: "Kon-Tiki K-01",
    feedstock: "prosopis_juliflora",
    weightKg: 820,
    productionDate: "2026-04-15",
    quality: "good",
    status: "complete",
    yieldPct: 18.4,
  },
  {
    code: "SW-AFR-20260413-002",
    operator: "Mohammed Ali",
    kiln: "Flame Curtain F-01",
    feedstock: "prosopis_juliflora",
    weightKg: 1140,
    productionDate: "2026-04-13",
    quality: "excellent",
    status: "lab_pending",
    yieldPct: 21.2,
  },
  {
    code: "SW-AFR-20260410-001",
    operator: "Fatima Omar",
    kiln: "Kon-Tiki K-02",
    feedstock: "prosopis_juliflora",
    weightKg: 680,
    productionDate: "2026-04-10",
    quality: "fair",
    status: "complete",
    yieldPct: 16.1,
  },
];

const qualityVariant = (q: string) =>
  q === "excellent" || q === "good" ? ("soil" as const) : ("earth" as const);

export default function BiocharPage() {
  return (
    <div className="p-8 bg-[#f8f7f3] min-h-full">
      <PageHeader
        title="Biochar Batches"
        description="Production records synced from ODK Central — biochar_batch_v1"
        action={
          <div
            className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border"
            style={{ background: "#fffdf8", borderColor: "#ffb100", color: "#8d5908" }}
          >
            <FlameKindling size={14} style={{ color: "#ffb100" }} />
            ODK Sync — last 15 min ago
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Batches (YTD)" value="38" sub="3 kilns active" accent="carbon" />
        <StatCard label="Biochar Produced" value="94.6 t" sub="wet weight" trend="up" trendLabel="+8 batches" accent="earth" />
        <StatCard label="Avg Yield Ratio" value="18.8%" sub="biochar / feedstock" accent="soil" />
        <StatCard label="Lab Results Pending" value="5" sub="samples awaiting" accent="red" />
      </div>

      <div className="bg-white rounded-xl border border-[#efede6] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#efede6] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1e1810]">Recent Batches</h2>
          <Badge label="Phase 1" variant="earth" />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#efede6] text-left">
              {["Batch Code", "Operator", "Kiln", "Feedstock", "Weight", "Yield", "Quality", "Status"].map((h) => (
                <th key={h} className="px-5 py-3 text-xs font-medium text-[#97928f] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f8f7f3]">
            {batches.map((b) => (
              <tr key={b.code} className="hover:bg-[#fffdf8] transition-colors cursor-pointer">
                <td className="px-5 py-3.5 font-mono text-xs text-[#62615c]">{b.code}</td>
                <td className="px-5 py-3.5 text-[#1e1810]">{b.operator}</td>
                <td className="px-5 py-3.5 text-[#62615c] text-xs">{b.kiln}</td>
                <td className="px-5 py-3.5">
                  <Badge label="Prosopis juliflora" variant="earth" />
                </td>
                <td className="px-5 py-3.5 text-[#1e1810]">{b.weightKg.toLocaleString()} kg</td>
                <td className="px-5 py-3.5 text-[#1e1810]">{b.yieldPct}%</td>
                <td className="px-5 py-3.5">
                  <Badge label={b.quality} variant={qualityVariant(b.quality)} />
                </td>
                <td className="px-5 py-3.5">
                  <Badge
                    label={b.status === "lab_pending" ? "Lab pending" : "Complete"}
                    variant={b.status === "complete" ? "green" : "earth"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-[#efede6] text-xs text-[#97928f]">
          Showing 3 of 38 batches — full list pending ODK sync implementation
        </div>
      </div>
    </div>
  );
}
