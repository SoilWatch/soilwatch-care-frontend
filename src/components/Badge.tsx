import clsx from "clsx";

type Variant = "earth" | "soil" | "red" | "carbon" | "stone" | "green";

const variants: Record<Variant, string> = {
  earth:  "bg-[#fff4cc] text-[#8d5908]",
  soil:   "bg-[#f8f7f3] text-[#62615c]",
  red:    "bg-red-50 text-red-700",
  carbon: "bg-[#e8eaed] text-[#4b4f58]",
  stone:  "bg-[#efede6] text-[#62615c]",
  green:  "bg-emerald-50 text-emerald-700",
};

export default function Badge({
  label,
  variant = "stone",
}: {
  label: string;
  variant?: Variant;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium",
        variants[variant]
      )}
    >
      {label}
    </span>
  );
}
