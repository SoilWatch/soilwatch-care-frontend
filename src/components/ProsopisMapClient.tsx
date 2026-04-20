"use client";

import dynamic from "next/dynamic";

const ProsopisMap = dynamic(() => import("@/components/ProsopisMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#efede6]">
      <p className="text-sm text-[#97928f]">Loading map…</p>
    </div>
  ),
});

export default function ProsopisMapClient({ mapboxToken }: { mapboxToken: string }) {
  return <ProsopisMap mapboxToken={mapboxToken} />;
}
