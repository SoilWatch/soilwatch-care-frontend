"use client";

import dynamic from "next/dynamic";
import type { Batch } from "./data";

const KilnMap = dynamic(() => import("./KilnMap"), {
    ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#f8f9fa]">
      <p className="text-sm text-[#6b7280]">Loading map…</p>
    </div>
  ),
});

export default function KilnMapClient({ mapboxToken, batches }: { mapboxToken: string; batches: Batch[] }) {
  return <KilnMap mapboxToken={mapboxToken} batches={batches} />;
}
