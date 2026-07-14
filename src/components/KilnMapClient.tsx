"use client";

import dynamic from "next/dynamic";

const KilnMap = dynamic(() => import("./KilnMap"), { ssr: false });
export default KilnMap;
