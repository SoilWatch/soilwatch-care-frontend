import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "CARE dMRV | SoilWatch",
  description: "Afar Prosopis Biochar digital MRV platform — CARE / SoilWatch",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex overflow-hidden bg-[#fafaf8]">
        <Sidebar userName="SoilWatch" />
        <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">{children}</main>
      </body>
    </html>
  );
}
