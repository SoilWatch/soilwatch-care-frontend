"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FlameKindling, MapPin, FileBarChart2, LogOut } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV = [
  { href: "/",        key: "nav.overview",   icon: LayoutDashboard },
  { href: "/biochar", key: "nav.production", icon: FlameKindling },
  { href: "/map",     key: "nav.map",        icon: MapPin },
  { href: "/reports", key: "nav.reports",    icon: FileBarChart2 },
];

export default function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const { t } = useLanguage();

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
            <p className="text-white text-sm font-semibold leading-none">{t("app.name")}</p>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#fb923c" }}>{t("app.tagline")}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3 pb-1">
        <LanguageSwitcher />
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={active
                ? { background: "rgba(194,65,12,0.2)", color: "#fb923c" }
                : { color: "#a8a29e" }
              }
            >
              <Icon size={14} style={{ flexShrink: 0 }} />
              <span className={active ? "font-medium" : "hover:text-white transition-colors"}>
                {t(key)}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-stone-800">
        {userName && (
          <p className="text-xs text-stone-400 truncate mb-2.5">{userName}</p>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-xs text-stone-500 hover:text-red-400 transition-colors w-full"
        >
          <LogOut size={13} />
          {t("sidebar.signOut")}
        </button>
      </div>
    </aside>
  );
}
