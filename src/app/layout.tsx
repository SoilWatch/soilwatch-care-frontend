import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "CARE dMRV | SoilWatch",
  description: "Afar Prosopis Biochar digital MRV platform — CARE / SoilWatch",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession().catch(() => null);

  return (
    <html lang="en" className="h-full">
      <body className="h-full flex overflow-hidden bg-[#fafaf8]">
        {session && <Sidebar userName={session.name} />}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
