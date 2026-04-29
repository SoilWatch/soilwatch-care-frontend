import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  accent?: "earth" | "soil" | "red" | "carbon" | "stone";
}

const accentMap: Record<NonNullable<StatCardProps["accent"]>, string> = {
  earth:  "bg-[#f8f9fa] border-[#e9ecef]",
  soil:   "bg-[#f8f9fa] border-[#e9ecef]",
  red:    "bg-[#FADBD8] border-[#E74C3C]",
  carbon: "bg-[#f8f9fa] border-[#e9ecef]",
  stone:  "bg-[#f8f9fa] border-[#e9ecef]",
};

const trendColor = {
  up:      "text-[#27AE60]",
  down:    "text-[#E74C3C]",
  neutral: "text-[#6b7280]",
};

export default function StatCard({
  label,
  value,
  sub,
  trend,
  trendLabel,
  accent = "stone",
}: StatCardProps) {
  return (
    <div className={clsx("rounded-lg border p-3 flex flex-col gap-1", accentMap[accent])}>
      <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: "#1F3864" }}>{value}</p>
      <div className="flex items-center gap-2">
        {sub && <p className="text-xs" style={{ color: "#6b7280" }}>{sub}</p>}
        {trend && trendLabel && (
          <span className={clsx("text-xs font-medium", trendColor[trend])}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "–"} {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
}
