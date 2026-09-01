"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, FlameKindling, MapPin, FileBarChart2, Menu, X } from "lucide-react";
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
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on navigation — adjusted during render (not in
  // an effect) per the React-recommended pattern for state that tracks a
  // changed prop, so it doesn't cause an extra render pass.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <>
      {/* Hamburger — mobile/tablet only, shown when sidebar is closed */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className={`
          fixed top-3 left-3 z-50 lg:hidden
          flex items-center justify-center w-9 h-9 rounded-lg
          transition-opacity duration-150
          ${open ? "opacity-0 pointer-events-none" : "opacity-100"}
        `}
        style={{ background: "#1c1917" }}
      >
        <Menu size={18} color="#fb923c" />
      </button>

      {/* Backdrop — mobile/tablet only */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-56 flex-shrink-0 flex flex-col h-full
          transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ background: "#1c1917" }}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/soilwatch-logo.jpg" alt="SoilWatch" width={28} height={28}
              className="rounded-md object-contain flex-shrink-0" />
            <div>
              <p className="text-white text-sm font-semibold leading-none">{t("app.name")}</p>
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#fb923c" }}>{t("app.tagline")}</p>
            </div>
          </div>

          {/* Close button — mobile/tablet only */}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md text-stone-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 pt-3 pb-1">
          <LanguageSwitcher />
        </div>

        {/* Nav */}
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

        {/* Footer */}
        {userName && (
          <div className="px-4 py-4 border-t border-stone-800">
            <p className="text-xs text-stone-400 truncate mb-2">{userName}</p>
            <button onClick={signOut}
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors">
              {t("sidebar.signOut")}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
