import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import { FileText, Lock } from "lucide-react";

const reports = [
  { title: "Quarterly Project Coverage Report", status: "Template", standard: null },
  { title: "Project Production Summary", status: "Available from ONA", standard: null },
  { title: "VM0044 Carbon Accounting", status: "Pending factors", standard: "VM0044" },
  { title: "CSI C-Sink Compliance Report", status: "Pending sensors", standard: "CSI C-Sink" },
];

export default function ReportsPage() {
  return (
    <div className="min-h-full bg-white">
      <PageHeader title="Project Reports" description="Monitoring, verification, and compliance reports for the Afar Prosopis Biochar project" />

      <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {reports.map((report) => {
          const available = report.status === "Available from ONA";
          return (
            <section key={report.title} className="bg-white rounded-lg border p-4" style={{ borderColor: "#e9ecef", opacity: available ? 1 : 0.78 }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: available ? "#D5F5E3" : "#f8f9fa" }}>
                    {available ? <FileText size={16} style={{ color: "#27AE60" }} /> : <Lock size={16} style={{ color: "#6b7280" }} />}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: "#1F3864" }}>{report.title}</h2>
                    <p className="mt-1 text-xs" style={{ color: "#6b7280" }}>{report.status}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {report.standard && <Badge label={report.standard} variant="carbon" />}
                  <Badge label={available ? "Ready" : "Pending"} variant={available ? "green" : "stone"} />
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
