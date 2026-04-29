import clsx from "clsx";

type Variant = "earth" | "soil" | "red" | "carbon" | "stone" | "green";

const variants: Record<Variant, string> = {
  earth:  "bg-[#fffbeb] text-[#92400e]",
  soil:   "bg-[#f8f9fa] text-[#6b7280]",
  red:    "bg-[#FADBD8] text-[#E74C3C]",
  carbon: "bg-[#eff6ff] text-[#2E75B6]",
  stone:  "bg-[#f8f9fa] text-[#6b7280]",
  green:  "bg-[#D5F5E3] text-[#166534]",
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
