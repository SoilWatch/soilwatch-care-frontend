"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Pickaxe,
  FlameKindling,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prosopis", label: "Project Map", icon: Layers },
  { href: "/harvesting", label: "Harvesting", icon: Pickaxe },
  { href: "/biochar", label: "Production", icon: FlameKindling },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

const dataSources = [
  { label: "ONA biochar form", ok: true },
  { label: "ODK harvesting form", ok: false },
  { label: "GEE satellite layers", ok: false },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full" style={{ background: "#0f172a" }}>
      {/* Logo */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "#1e293b" }}>
        <div className="flex items-center gap-2.5">
          <Image src="/soilwatch-logo.jpg" alt="SoilWatch" width={30} height={30} className="rounded-md object-contain" />
          <div>
            <p className="text-white font-bold text-sm leading-none">SoilWatch</p>
            <p className="text-[10px] mt-0.5 font-semibold uppercase tracking-widest" style={{ color: "#f59e0b" }}>CARE dMRV</p>
          </div>
        </div>
      </div>

      {/* Project context */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "#1e293b" }}>
        <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#f59e0b" }}>Active Project</p>
          <p className="text-white text-xs font-semibold leading-tight">Afar Prosopis</p>
          <p className="text-[10px] leading-tight" style={{ color: "#475569" }}>Biochar Project · CP2 Kiln</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={active ? { background: "rgba(59,130,246,0.15)", color: "#60a5fa" } : undefined}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "font-medium"
                  : "font-normal hover:bg-white/5",
              )}
            >
              <Icon size={15} style={{ color: active ? "#60a5fa" : "#475569" }} />
              <span className={active ? "text-[#60a5fa]" : "text-white/50 hover:text-white/80"}>{label}</span>
              {active && <ChevronRight size={13} className="ml-auto" style={{ color: "#60a5fa" }} />}
            </Link>
          );
        })}
      </nav>

      {/* Data sources */}
      <div className="px-4 py-3 border-t" style={{ borderColor: "#1e293b" }}>
        <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "#334155" }}>Data Sources</p>
        <div className="space-y-1.5">
          {dataSources.map(ds => (
            <div key={ds.label} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ background: ds.ok ? "#10b981" : "#334155" }} />
              <span className="text-[10px]" style={{ color: ds.ok ? "#94a3b8" : "#334155" }}>{ds.label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
