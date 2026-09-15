"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, FlameKindling, MapPin, FileBarChart2, Settings, Menu, X, LogOut, UserCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV = [
  { href: "/",        key: "nav.overview",   icon: LayoutDashboard },
  { href: "/biochar", key: "nav.production", icon: FlameKindling },
  { href: "/map",     key: "nav.map",        icon: MapPin },
  { href: "/reports", key: "nav.reports",    icon: FileBarChart2 },
];

export default function Sidebar({ userName, userEmail, role }: { userName?: string; userEmail?: string; role?: string }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

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
        <Menu size={18} color="#ffffff" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        />
      )}

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
        <div className="px-4 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/soilwatch-logo.jpg" alt="SoilWatch" width={28} height={28}
              className="rounded-md object-contain flex-shrink-0" />
            <div>
              <p className="text-white text-sm font-semibold leading-none">{t("app.name")}</p>
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#a8a29e" }}>{t("app.tagline")}</p>
            </div>
          </div>

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

        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV.map(({ href, key, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors"
                style={active
                  ? { background: "rgba(255,255,255,0.08)", color: "#ffffff" }
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
          {role === "admin" && (() => {
            const active = pathname.startsWith("/admin");
            return (
              <Link href="/admin"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors mt-1"
                style={active
                  ? { background: "rgba(255,255,255,0.08)", color: "#ffffff" }
                  : { color: "#a8a29e" }
                }
              >
                <Settings size={14} style={{ flexShrink: 0 }} />
                <span className={active ? "font-medium" : "hover:text-white transition-colors"}>
                  Admin
                </span>
              </Link>
            );
          })()}
        </nav>

        <div className="px-4 py-4 border-t border-stone-800">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 mb-3 group"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-white"
              style={{ background: "#c2410c" }}
            >
              {userName
                ? userName.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join("")
                : <UserCircle size={14} />}
            </div>
            <div className="min-w-0">
              {userName && (
                <p className="text-xs font-medium text-stone-300 group-hover:text-white transition-colors truncate">
                  {userName}
                </p>
              )}
              {userEmail && (
                <p className="text-[11px] text-stone-500 group-hover:text-stone-400 transition-colors truncate">
                  {userEmail}
                </p>
              )}
            </div>
          </Link>
          <button onClick={signOut}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-white transition-colors">
            <LogOut size={12} />
            {t("sidebar.signOut")}
          </button>
        </div>
      </aside>
    </>
  );
}
