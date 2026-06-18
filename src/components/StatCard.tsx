interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  accent?: "earth" | "soil" | "red" | "carbon" | "stone" | "green";
}

const accentBar: Record<NonNullable<StatCardProps["accent"]>, string> = {
  earth:  "#f59e0b",
  soil:   "#64748b",
  red:    "#ef4444",
  carbon: "#6366f1",
  stone:  "#94a3b8",
  green:  "#10b981",
};

export default function StatCard({ label, value, sub, trend, trendLabel, accent = "stone" }: StatCardProps) {
  const bar = accentBar[accent];
  return (
    <div className="rounded-xl border bg-white overflow-hidden shadow-sm" style={{ borderColor: "#e2e8f0" }}>
      <div className="h-1" style={{ background: bar }} />
      <div className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>{label}</p>
        <p className="text-2xl font-bold mt-1" style={{ color: "#0f172a" }}>{value}</p>
        <div className="flex items-center gap-2 mt-1">
          {sub && <p className="text-xs" style={{ color: "#64748b" }}>{sub}</p>}
          {trend && trendLabel && (
            <span className="text-xs font-semibold" style={{ color: trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#64748b" }}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "–"} {trendLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
