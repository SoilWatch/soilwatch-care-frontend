"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Download, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Format = "pdf" | "docx";

interface ArchivedReport {
  id: string;
  title: string;
  format: Format;
  generated: string;
  date_from: string;
  date_to: string;
  batches: number;
  size: number;
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ReportGenerator() {
  const { t } = useLanguage();
  const [title, setTitle] = useState("Biochar Production Report");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState(false);
  const [archive, setArchive] = useState<ArchivedReport[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadArchive = useCallback(() => {
    return fetch("/api/reports/archive", { cache: "no-store" })
      .then(res => (res.ok ? res.json() : { reports: [] }))
      .then(data => setArchive(Array.isArray(data.reports) ? data.reports : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reports/archive", { cache: "no-store" })
      .then(res => (res.ok ? res.json() : { reports: [] }))
      .then(data => {
        if (!cancelled) setArchive(Array.isArray(data.reports) ? data.reports : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function triggerDownload(url: string, fallbackName: string) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const disposition = res.headers.get("content-disposition") ?? "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = match?.[1] ?? fallbackName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  }

  async function generate(format: Format) {
    setBusy(format);
    setError(false);
    try {
      const qs = new URLSearchParams({ format });
      if (title.trim()) qs.set("title", title.trim());
      if (from) qs.set("date_from", from);
      if (to) qs.set("date_to", to);
      await triggerDownload(`/api/reports/generate?${qs}`, `report.${format}`);
      await loadArchive();
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/reports/archive/${id}`, { method: "DELETE" });
      if (res.ok) setArchive(prev => prev.filter(r => r.id !== id));
    } catch {
      /* ignore */
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section className="bg-white rounded-lg border p-4" style={{ borderColor: "#e9ecef" }}>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#D5F5E3" }}>
          <FileText size={16} style={{ color: "#27AE60" }} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold" style={{ color: "#1F3864" }}>{t("reports.generate.heading")}</h2>
          <p className="mt-1 text-xs" style={{ color: "#6b7280" }}>{t("reports.generate.desc")}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-xs sm:col-span-3" style={{ color: "#374151" }}>
          {t("reports.generate.titleLabel")}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm"
            style={{ borderColor: "#d1d5db" }}
          />
        </label>
        <label className="text-xs" style={{ color: "#374151" }}>
          {t("reports.generate.from")}
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={e => setFrom(e.target.value)}
            className="mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm"
            style={{ borderColor: "#d1d5db" }}
          />
        </label>
        <label className="text-xs" style={{ color: "#374151" }}>
          {t("reports.generate.to")}
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={e => setTo(e.target.value)}
            className="mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm"
            style={{ borderColor: "#d1d5db" }}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["pdf", "docx"] as const).map(format => (
          <button
            key={format}
            onClick={() => generate(format)}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-opacity disabled:opacity-60"
            style={{ background: "#27AE60" }}
          >
            {busy === format ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            {busy === format
              ? t("reports.generate.generating")
              : format === "pdf" ? t("reports.generate.pdf") : t("reports.generate.word")}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-2 text-xs" style={{ color: "#b91c1c" }}>{t("reports.generate.error")}</p>
      )}

      <div className="mt-5 border-t pt-4" style={{ borderColor: "#e9ecef" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6b7280" }}>
          {t("reports.archive.heading")}
        </h3>
        {archive.length === 0 ? (
          <p className="mt-2 text-xs" style={{ color: "#9ca3af" }}>{t("reports.archive.empty")}</p>
        ) : (
          <ul className="mt-2 divide-y" style={{ borderColor: "#f1f3f5" }}>
            {archive.map(r => (
              <li key={r.id} className="py-2 flex items-center gap-3">
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0"
                  style={{ background: r.format === "pdf" ? "#FEE2E2" : "#DBEAFE", color: r.format === "pdf" ? "#b91c1c" : "#1e40af" }}
                >
                  {r.format}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate" style={{ color: "#1F3864" }}>{r.title}</p>
                  <p className="text-[11px]" style={{ color: "#9ca3af" }}>
                    {fmtDateTime(r.generated)} · {r.date_from} → {r.date_to} · {t("reports.archive.batches", { n: r.batches })} · {fmtBytes(r.size)}
                  </p>
                </div>
                <a
                  href={`/api/reports/archive/${r.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium flex-shrink-0"
                  style={{ color: "#27AE60" }}
                >
                  <Download size={13} /> {t("reports.archive.download")}
                </a>
                <button
                  onClick={() => remove(r.id)}
                  disabled={deleting === r.id}
                  aria-label={t("reports.archive.delete")}
                  className="flex-shrink-0 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting === r.id
                    ? <Loader2 size={13} className="animate-spin" style={{ color: "#9ca3af" }} />
                    : <Trash2 size={13} style={{ color: "#b91c1c" }} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
