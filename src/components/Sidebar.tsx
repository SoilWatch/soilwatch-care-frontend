"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Pickaxe,
  FlameKindling,
  BarChart3,
  Settings,
  Leaf,
} from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prosopis", label: "Prosopis Map", icon: Layers },
  { href: "/harvesting", label: "Harvesting", icon: Pickaxe },
  { href: "/biochar", label: "Biochar", icon: FlameKindling },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full" style={{ background: "#1e1810" }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#ffb100" }}
          >
            <Leaf size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">SoilWatch</p>
            <p className="text-white/40 text-[10px] mt-0.5 uppercase tracking-wider">CARE dMRV</p>
          </div>
        </div>
      </div>

      {/* Tenant badge */}
      <div className="px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "#ffb100" }} />
          <span className="text-white/50 text-xs">Afar Region — Ethiopia</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={active ? { background: "#ffb100" } : undefined}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "text-white font-medium"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        >
          <Settings size={16} />
          Settings
        </Link>
        <p className="text-white/20 text-[10px] px-3 mt-3">Phase 1 — v0.1.0</p>
      </div>
    </aside>
  );
}
