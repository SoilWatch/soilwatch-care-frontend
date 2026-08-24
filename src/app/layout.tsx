import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "CARE dMRV | SoilWatch",
  description: "Afar Prosopis Biochar digital MRV platform — CARE / SoilWatch",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className="h-full">
      <body className="h-full flex overflow-hidden bg-[#fafaf8]">
        <LanguageProvider initialLocale={locale}>
          <Sidebar userName="SoilWatch" />
          <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
