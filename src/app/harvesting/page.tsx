import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import { MapPin } from "lucide-react";

const events = [
  {
    id: "HE-001",
    date: "2026-04-12",
    location: "Gewane, Block A",
    coords: "11.4823° N, 40.1567° E",
    areaHa: 12.4,
    biomassKg: 8200,
    outcome: "biochar",
    harvester: "Cooperative 1 — Amina H.",
  },
  {
    id: "HE-002",
    date: "2026-04-08",
    location: "Awash, Riverside",
    coords: "11.6701° N, 40.1702° E",
    areaHa: 8.1,
    biomassKg: 5400,
    outcome: "biochar",
    harvester: "Cooperative 2 — Mohammed A.",
  },
  {
    id: "HE-003",
    date: "2026-03-28",
    location: "Gewane, Block C",
    coords: "11.4901° N, 40.1488° E",
    areaHa: 15.7,
    biomassKg: 10100,
    outcome: "fuel",
    harvester: "Cooperative 1 — Fatima O.",
  },
];

const outcomeVariant = (o: string) =>
  o === "biochar" ? ("soil" as const) : o === "fuel" ? ("carbon" as const) : ("stone" as const);

export default function HarvestingPage() {
  return (
    <div className="p-8 bg-[#f8f7f3] min-h-full">
      <PageHeader
        title="Harvesting Events"
        description="Prosopis juliflora removal records — area, biomass, and management outcome"
        action={
          <button
            className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ background: "#ffb100" }}
          >
            <MapPin size={15} />
            Log Event
          </button>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Area Cleared" value="1,840 ha" sub="YTD 2026" trend="up" trendLabel="+12%" accent="soil" />
        <StatCard label="Total Biomass" value="1,218 t" sub="estimated dry weight" accent="earth" />
        <StatCard label="Harvesting Events" value="24" sub="logged this year" accent="carbon" />
        <StatCard label="To Biochar" value="78%" sub="of biomass managed" accent="stone" />
      </div>

      <div className="bg-white rounded-xl border border-[#efede6] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#efede6]">
          <h2 className="text-sm font-semibold text-[#1e1810]">Recent Events</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#efede6] text-left">
              {["ID", "Date", "Location", "Area", "Biomass (est.)", "Outcome", "Harvester"].map((h) => (
                <th key={h} className="px-5 py-3 text-xs font-medium text-[#97928f] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f8f7f3]">
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-[#fffdf8] transition-colors cursor-pointer">
                <td className="px-5 py-3.5 font-mono text-xs text-[#62615c]">{e.id}</td>
                <td className="px-5 py-3.5 text-[#1e1810]">{e.date}</td>
                <td className="px-5 py-3.5">
                  <p className="text-[#1e1810]">{e.location}</p>
                  <p className="text-xs text-[#97928f] mt-0.5">{e.coords}</p>
                </td>
                <td className="px-5 py-3.5 text-[#1e1810]">{e.areaHa} ha</td>
                <td className="px-5 py-3.5 text-[#1e1810]">{e.biomassKg.toLocaleString()} kg</td>
                <td className="px-5 py-3.5">
                  <Badge label={e.outcome} variant={outcomeVariant(e.outcome)} />
                </td>
                <td className="px-5 py-3.5 text-[#62615c] text-xs">{e.harvester}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-[#efede6] text-xs text-[#97928f]">
          Showing 3 of 24 events — full list pending API integration
        </div>
      </div>
    </div>
  );
}
