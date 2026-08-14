"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, FlameKindling, MapPin, FileBarChart2, Menu, X } from "lucide-react";

const NAV = [
  { href: "/",        label: "Overview",   icon: LayoutDashboard },
  { href: "/biochar", label: "Production", icon: FlameKindling },
  { href: "/map",     label: "Field Map",  icon: MapPin },
  { href: "/reports", label: "Reports",    icon: FileBarChart2 },
];

export default function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close when navigating
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on Escape
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/soilwatch-logo.jpg"
              alt="SoilWatch"
              width={28}
              height={28}
              className="rounded-md object-contain flex-shrink-0"
            />
            <div>
              <p className="text-white text-sm font-semibold leading-none">SoilWatch</p>
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#fb923c" }}>CARE dMRV</p>
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

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors"
                style={active
                  ? { background: "rgba(194,65,12,0.2)", color: "#fb923c" }
                  : { color: "#a8a29e" }
                }
              >
                <Icon size={14} style={{ flexShrink: 0 }} />
                <span className={active ? "font-medium" : "hover:text-white transition-colors"}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {userName && (
          <div className="px-4 py-4 border-t border-stone-800">
            <p className="text-xs text-stone-400 truncate mb-2">{userName}</p>
            <button
              onClick={signOut}
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
