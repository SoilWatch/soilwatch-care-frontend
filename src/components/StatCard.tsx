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
  earth:  "bg-[#fffdf8] border-[#ffb100]/40",
  soil:   "bg-[#f8f7f3] border-[#d4c9b0]",
  red:    "bg-red-50 border-red-200",
  carbon: "bg-[#f8f7f3] border-[#4b4f58]/20",
  stone:  "bg-white border-[#efede6]",
};

const trendColor = {
  up:      "text-[#8d5908]",
  down:    "text-red-500",
  neutral: "text-[#97928f]",
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
    <div className={clsx("rounded-xl border p-5 flex flex-col gap-3", accentMap[accent])}>
      <p className="text-xs font-medium text-[#97928f] uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-[#1e1810]">{value}</p>
      <div className="flex items-center gap-2">
        {sub && <p className="text-xs text-[#97928f]">{sub}</p>}
        {trend && trendLabel && (
          <span className={clsx("text-xs font-medium", trendColor[trend])}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "–"} {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
}
