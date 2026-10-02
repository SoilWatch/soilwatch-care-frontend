"use client";

import dynamic from "next/dynamic";

const KilnMap = dynamic(() => import("./ProsopisMapExplorer"), { ssr: false });
export default KilnMap;
