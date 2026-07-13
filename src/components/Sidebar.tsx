"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FlameKindling, MapPin, FileBarChart2 } from "lucide-react";

const NAV = [
  { href: "/",        label: "Overview",   icon: LayoutDashboard },
  { href: "/biochar", label: "Production", icon: FlameKindling },
  { href: "/map",     label: "Field Map",  icon: MapPin },
  { href: "/reports", label: "Reports",    icon: FileBarChart2 },
];

export default function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-full" style={{ background: "#1c1917" }}>
      <div className="px-4 py-4 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <Image src="/soilwatch-logo.jpg" alt="SoilWatch" width={28} height={28}
            className="rounded-md object-contain flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-semibold leading-none">SoilWatch</p>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#fb923c" }}>CARE dMRV</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={active
                ? { background: "rgba(194,65,12,0.2)", color: "#fb923c" }
                : { color: "#57534e" }
              }
            >
              <Icon size={14} style={{ flexShrink: 0 }} />
              <span className={active ? "font-medium" : "hover:text-stone-300 transition-colors"}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {userName && (
        <div className="px-4 py-4 border-t border-stone-800">
          <p className="text-xs text-stone-600 truncate mb-2">{userName}</p>
          <button onClick={signOut}
            className="text-xs text-stone-700 hover:text-stone-400 transition-colors">
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
