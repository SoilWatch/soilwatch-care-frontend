"use client";

import dynamic from "next/dynamic";

const HarvestingMap = dynamic(() => import("./HarvestingMap"), { ssr: false });

export default function HarvestingMapClient({ mapboxToken }: { mapboxToken: string }) {
  return <HarvestingMap mapboxToken={mapboxToken} />;
}
