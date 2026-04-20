import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import { BarChart3, FileText, Lock } from "lucide-react";

const reports = [
  {
    title: "Quarterly Prosopis Coverage Report",
    description: "Invasion extent, change detection, and cleared area — Q1 2026",
    quarter: "2026-Q1",
    available: true,
    standard: null,
  },
  {
    title: "Biochar Production Summary",
    description: "Batch counts, yield ratios, quality distribution — Q1 2026",
    quarter: "2026-Q1",
    available: true,
    standard: null,
  },
  {
    title: "VM0044 Carbon Accounting",
    description: "Gross/net CO₂e, permanence class, methodology pathway",
    quarter: "2026-Q1",
    available: false,
    standard: "VM0044",
  },
  {
    title: "CSI C-Sink Compliance Report",
    description: "Temperature sensor data, H:C ratio, chain-of-custody",
    quarter: "2026-Q1",
    available: false,
    standard: "CSI C-Sink",
  },
];

export default function ReportsPage() {
  return (
    <div className="p-8 bg-[#f8f7f3] min-h-full">
      <PageHeader
        title="Reports"
        description="Monitoring, verification, and compliance reports"
      />

      <div className="grid grid-cols-2 gap-4">
        {reports.map((r) => (
          <div
            key={r.title}
            className="bg-white rounded-xl border p-5"
            style={{
              borderColor: r.available ? "#efede6" : "#f4f2ed",
              opacity: r.available ? 1 : 0.65,
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: r.available ? "#fff4cc" : "#f8f7f3" }}
              >
                {r.available ? (
                  <BarChart3 size={16} style={{ color: "#ffb100" }} />
                ) : (
                  <Lock size={16} className="text-[#97928f]" />
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge label={r.quarter} variant="stone" />
                {r.standard && <Badge label={r.standard} variant="carbon" />}
                {!r.available && <Badge label="Phase 2" variant="soil" />}
              </div>
            </div>
            <h3 className="text-sm font-semibold text-[#1e1810] mb-1">{r.title}</h3>
            <p className="text-xs text-[#97928f] mb-4">{r.description}</p>
            <button
              disabled={!r.available}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
              style={
                r.available
                  ? { borderColor: "#ffb100", color: "#8d5908", background: "#fffdf8" }
                  : { borderColor: "#efede6", color: "#97928f", cursor: "not-allowed" }
              }
            >
              <FileText size={12} />
              {r.available ? "View Report" : "Not yet available"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
