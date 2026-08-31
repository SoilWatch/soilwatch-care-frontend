import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getSession } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "CARE dMRV | SoilWatch",
  description: "Afar Prosopis Biochar digital MRV platform — CARE / SoilWatch",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, locale] = await Promise.all([
    getSession().catch(() => null),
    getLocale(),
  ]);

  return (
    <html lang={locale} className="h-full">
      <body className="h-full flex overflow-hidden bg-[#fafaf8]">
        <LanguageProvider initialLocale={locale}>
          {session && <Sidebar userName={session.fullName} />}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
