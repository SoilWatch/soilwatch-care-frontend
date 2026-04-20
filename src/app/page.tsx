import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const recentActivity = [
  {
    id: 1,
    type: "Prosopis Layer",
    description: "2026-Q1 layer ingested from GEE",
    time: "2 hours ago",
    status: "success",
  },
  {
    id: 2,
    type: "Biochar Batch",
    description: "SW-AFR-20260415-003 submitted by Amina H.",
    time: "5 hours ago",
    status: "success",
  },
  {
    id: 3,
    type: "Harvesting Event",
    description: "12.4 ha cleared near Gewane — biomass 8,200 kg",
    time: "Yesterday",
    status: "success",
  },
  {
    id: 4,
    type: "Lab Results",
    description: "Batch SW-AFR-20260410-001 — H:C ratio missing",
    time: "2 days ago",
    status: "warning",
  },
  {
    id: 5,
    type: "ODK Sync",
    description: "3 submissions queued — ODK Central unreachable",
    time: "2 days ago",
    status: "error",
  },
];

const badgeVariant = (type: string) => {
  if (type === "Prosopis Layer") return "earth" as const;
  if (type === "Biochar Batch") return "carbon" as const;
  if (type === "Lab Results") return "earth" as const;
  if (type === "ODK Sync") return "red" as const;
  return "soil" as const;
};

export default function DashboardPage() {
  return (
    <div className="p-8 bg-[#f8f7f3] min-h-full">
      <PageHeader
        title="Overview"
        description="CARE dMRV — Afar Region, Ethiopia · Q1 2026"
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Prosopis Area Mapped"
          value="48,230 ha"
          sub="as of 2026-Q1"
          trend="down"
          trendLabel="−3.2% vs Q4 2025"
          accent="earth"
        />
        <StatCard
          label="Area Cleared (YTD)"
          value="1,840 ha"
          sub="harvesting events"
          trend="up"
          trendLabel="+12% vs last quarter"
          accent="soil"
        />
        <StatCard
          label="Biochar Produced (YTD)"
          value="94.6 t"
          sub="38 batches · 3 kilns"
          trend="up"
          trendLabel="+8 batches vs Q4"
          accent="carbon"
        />
        <StatCard
          label="Est. CO₂e Sequestered"
          value="—"
          sub="Phase 2 calculation"
          accent="stone"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="col-span-2 bg-white rounded-xl border border-[#efede6] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#efede6]">
            <h2 className="text-sm font-semibold text-[#1e1810]">Recent Activity</h2>
          </div>
          <ul className="divide-y divide-[#f8f7f3]">
            {recentActivity.map((item) => (
              <li key={item.id} className="px-5 py-3.5 flex items-start gap-3">
                <div className="mt-0.5">
                  {item.status === "success" && (
                    <CheckCircle2 size={15} className="text-emerald-500" />
                  )}
                  {item.status === "warning" && (
                    <AlertTriangle size={15} style={{ color: "#ffb100" }} />
                  )}
                  {item.status === "error" && (
                    <AlertTriangle size={15} className="text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge label={item.type} variant={badgeVariant(item.type)} />
                  </div>
                  <p className="text-sm text-[#1e1810]">{item.description}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#97928f] whitespace-nowrap">
                  <Clock size={11} />
                  {item.time}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Phase status */}
        <div className="bg-white rounded-xl border border-[#efede6] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#efede6]">
            <h2 className="text-sm font-semibold text-[#1e1810]">Phase Progress</h2>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-[#62615c]">Phase 1 — MVP</span>
                <Badge label="In progress" variant="earth" />
              </div>
              <div className="h-2 bg-[#efede6] rounded-full overflow-hidden">
                <div className="h-full w-[32%] rounded-full" style={{ background: "#ffb100" }} />
              </div>
              <p className="text-[11px] text-[#97928f] mt-1.5">Target: Oct 2026</p>
            </div>

            <div className="space-y-2.5">
              {[
                { label: "Prosopis mapping", done: true },
                { label: "Biochar data model", done: true },
                { label: "ODK sync service", done: false },
                { label: "Auth (Firebase)", done: false },
                { label: "Lab results flow", done: false },
                { label: "NRM dashboards", done: false },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={
                      done
                        ? { background: "#ffb100", borderColor: "#ffb100" }
                        : { borderColor: "#d4cec4" }
                    }
                  >
                    {done && (
                      <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs ${done ? "text-[#1e1810]" : "text-[#97928f]"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#efede6]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-[#97928f]">Phase 2 — Full dMRV</span>
                <Badge label="Planned" variant="stone" />
              </div>
              <p className="text-[11px] text-[#97928f]">Target: Sep 2027</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
