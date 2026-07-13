"use client";

import { useMemo, useRef, useState } from "react";
import type { BiocharDataSource } from "./ona";
import {
  computeKpis, computeSiteTrends, computeOperatorScores, computeDecisionSnapshot, daysAgo,
} from "./compute";
import { ACTIVE_WINDOW_DAYS, COMPLIANCE_WINDOW_DAYS } from "./data";
import TabProduction from "./tabs/TabProduction";
import TabQuality from "./tabs/TabQuality";
import TabOperations from "./tabs/TabOperations";
import TabRecords from "./tabs/TabRecords";

const C = {
  brand: "#c2410c",
  border: "#e7e5e4", text: "#1c1917", muted: "#78716c",
  success: "#15803d", successBg: "#f0fdf4",
  danger: "#b91c1c", dangerBg: "#fef2f2",
  warning: "#b45309", warningBg: "#fffbeb",
  bg: "#fafaf8",
};

type Tab = "production" | "quality" | "operations" | "records";
type Panel = "snapshot" | "ai" | null;

const TABS: { id: Tab; label: string }[] = [
  { id: "production", label: "Production" },
  { id: "quality",    label: "Quality" },
  { id: "operations", label: "Operations" },
  { id: "records",    label: "Records" },
];

function KpiCard({ label, value, sub, flag }: { label: string; value: string; sub?: string; flag?: boolean }) {
  return (
    <div className="bg-white rounded-xl border p-4 flex flex-col" style={{ borderColor: C.border }}>
      <p className="text-xs font-medium" style={{ color: C.muted }}>{label}</p>
      <p className="text-2xl font-bold mt-1 leading-tight" style={{ color: flag ? C.danger : C.text }}>{value}</p>
      {sub && <p className="text-xs mt-1.5" style={{ color: C.muted }}>{sub}</p>}
    </div>
  );
}

interface ChatMessage { role: "user" | "assistant"; content: string }

function buildContext(kpis: ReturnType<typeof computeKpis>, df: { batch_id: string; kiln_id: string; production_date: string; biochar_wet_weight_kg: number; compliance_fails: number }[]): string {
  return [
    `Total batches: ${kpis.totalBatches}`,
    `This month: ${kpis.monthBatches}, this week: ${kpis.weekBatches}`,
    `Total biochar (wet): ${kpis.totalBiochar.toFixed(1)} kg`,
    `Dry biochar (est.): ${kpis.dryBiochar.toFixed(1)} kg`,
    `Active kilns: ${kpis.activeKilns} / ${kpis.totalKilns}`,
    `Active operators: ${kpis.activeOps} / ${kpis.totalOps}`,
    `Quality pass rate: ${kpis.qualPassRate.toFixed(1)}%`,
    `CSI compliant: ${kpis.csiCompliant} / ${kpis.totalBatches}`,
    `Compliance flags (30d): ${kpis.compFlagsN}`,
    `Safety incidents: ${kpis.safetyInc}`,
    `Avg pyrolysis: ${kpis.avgDuration.toFixed(0)} min (${kpis.minDuration}–${kpis.maxDuration} min)`,
    `Samples collected: ${kpis.samplesCol} / ${kpis.totalBatches}`,
    `Recent: ${df.slice(0, 5).map(b => `${b.batch_id}@${b.kiln_id} ${b.production_date} ${b.biochar_wet_weight_kg.toFixed(0)}kg fails:${b.compliance_fails}`).join(", ")}`,
  ].join("\n");
}

interface Props { dataSource: BiocharDataSource }

export default function BiocharDashboard({ dataSource }: Props) {
  const allBatches = dataSource.batches;

  const [activeTab, setActiveTab]     = useState<Tab>("production");
  const [drillFilter, setDrillFilter] = useState<string | null>(null);
  const [openPanel, setOpenPanel]     = useState<Panel>(null);
  const [aiMessages, setAiMessages]   = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput]         = useState("");
  const [aiLoading, setAiLoading]     = useState(false);
  const aiInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const earliest = allBatches.length ? allBatches[allBatches.length - 1].production_date : daysAgo(90);
  const latest   = allBatches.length ? allBatches[0].production_date : new Date().toISOString().slice(0, 10);

  const [dateFrom, setDateFrom] = useState(earliest);
  const [dateTo,   setDateTo]   = useState(latest);

  const df = useMemo(
    () => allBatches.filter(b => b.production_date >= dateFrom && b.production_date <= dateTo),
    [allBatches, dateFrom, dateTo],
  );

  const kpis           = useMemo(() => computeKpis(df), [df]);
  const siteTrends     = useMemo(() => computeSiteTrends(df), [df]);
  const operatorScores = useMemo(() => computeOperatorScores(df), [df]);
  const snapshot       = useMemo(() => computeDecisionSnapshot(df), [df]);

  const hasData = df.length > 0 && !dataSource.error;

  function togglePanel(p: Panel) {
    setOpenPanel(prev => (prev === p ? null : p));
  }

  async function sendAiMessage() {
    const q = aiInput.trim();
    if (!q || aiLoading) return;
    const next: ChatMessage[] = [...aiMessages, { role: "user", content: q }];
    setAiMessages(next);
    setAiInput("");
    setAiLoading(true);
    try {
      const res = await fetch("/api/biochar/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: buildContext(kpis, df), messages: next }),
      });
      const data = await res.json().catch(() => ({ answer: "Unexpected response." }));
      setAiMessages(m => [...m, { role: "assistant", content: data.answer ?? "No answer." }]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      setAiMessages(m => [...m, { role: "assistant", content: "Request failed. Check your connection." }]);
    } finally {
      setAiLoading(false);
      setTimeout(() => aiInputRef.current?.focus(), 50);
    }
  }

  const criticalCount = snapshot.critical.length;

  return (
    <div className="min-h-full" style={{ background: C.bg }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="border-b bg-white px-6 py-4" style={{ borderColor: C.border }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
              CARE Ethiopia · SoilWatch · Biochar Production
            </p>
            <h1 className="text-xl font-bold mt-0.5" style={{ color: C.text }}>
              CSI Artisan Pro Monitoring Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Date range */}
            <span className="text-xs" style={{ color: C.muted }}>Period</span>
            <input type="date" value={dateFrom} max={dateTo}
              onChange={e => setDateFrom(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1"
              style={{ borderColor: C.border }} />
            <span className="text-xs" style={{ color: C.muted }}>to</span>
            <input type="date" value={dateTo} min={dateFrom}
              onChange={e => setDateTo(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1"
              style={{ borderColor: C.border }} />
            {(dateFrom !== earliest || dateTo !== latest) && (
              <button onClick={() => { setDateFrom(earliest); setDateTo(latest); }}
                className="text-xs px-2.5 py-1.5 rounded-lg border hover:bg-stone-50 transition-colors"
                style={{ borderColor: C.border, color: C.muted }}>
                Reset
              </button>
            )}

            <div className="w-px h-5 mx-1" style={{ background: C.border }} />

            {/* Decision Snapshot button */}
            <button
              onClick={() => togglePanel("snapshot")}
              className="relative flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-stone-50"
              style={{
                borderColor: openPanel === "snapshot" ? C.brand : C.border,
                color: openPanel === "snapshot" ? C.brand : C.text,
                background: openPanel === "snapshot" ? "#fff7ed" : undefined,
              }}>
              {criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                  style={{ background: C.danger }}>{criticalCount}</span>
              )}
              Decision Snapshot
            </button>

            {/* Ask AI button */}
            <button
              onClick={() => togglePanel("ai")}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-stone-50"
              style={{
                borderColor: openPanel === "ai" ? C.brand : C.border,
                color: openPanel === "ai" ? C.brand : C.text,
                background: openPanel === "ai" ? "#fff7ed" : undefined,
              }}>
              Ask AI
            </button>
          </div>
        </div>
      </header>

      {/* ── Error banner ───────────────────────────────────────────── */}
      {dataSource.error && (
        <div className="mx-6 mt-4 rounded-xl border px-4 py-3 text-sm"
          style={{ background: C.dangerBg, borderColor: C.danger, color: "#991b1b" }}>
          <strong>ONA connection issue:</strong> {dataSource.error}
        </div>
      )}

      {/* ── KPI rows ───────────────────────────────────────────────── */}
      <div className="px-6 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Total batches"
          value={hasData ? String(kpis.totalBatches) : "—"}
          sub={hasData ? `${kpis.monthBatches} this month · ${kpis.weekBatches} this week` : "ONA not connected"}
        />
        <KpiCard
          label="Biochar produced"
          value={hasData ? `${kpis.totalBiochar.toFixed(0)} kg` : "—"}
          sub={hasData ? `${kpis.dryBiochar.toFixed(0)} kg dry est.` : undefined}
        />
        <KpiCard
          label="Active kilns"
          value={hasData ? `${kpis.activeKilns} / ${kpis.totalKilns}` : "—"}
          sub={`last ${ACTIVE_WINDOW_DAYS} days`}
        />
        <KpiCard
          label="CSI compliance"
          value={hasData ? `${kpis.csiCompliant} / ${kpis.totalBatches}` : "—"}
          sub={hasData ? `${kpis.compFlagsN} flag(s) in last ${COMPLIANCE_WINDOW_DAYS}d` : undefined}
          flag={hasData && kpis.compFlagsN > 0}
        />
      </div>

      {hasData && (
        <div className="px-6 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label="Quality pass rate"
            value={`${kpis.qualPassRate.toFixed(0)}%`}
            sub="excellent or good"
            flag={kpis.qualPassRate < 50}
          />
          <KpiCard
            label="Avg pyrolysis"
            value={`${kpis.avgDuration.toFixed(0)} min`}
            sub={`${kpis.minDuration}–${kpis.maxDuration} min range`}
            flag={kpis.durationFlag}
          />
          <KpiCard
            label="Safety incidents"
            value={String(kpis.safetyInc)}
            sub="last 30 days"
            flag={kpis.safetyInc > 0}
          />
          <KpiCard
            label="Active operators"
            value={`${kpis.activeOps} / ${kpis.totalOps}`}
            sub={`last ${ACTIVE_WINDOW_DAYS} days`}
          />
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="px-6 mt-6">
        <div className="flex border-b" style={{ borderColor: C.border }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-5 py-2.5 text-sm font-medium -mb-px transition-colors"
              style={{
                color: activeTab === tab.id ? C.brand : C.muted,
                borderBottom: `2px solid ${activeTab === tab.id ? C.brand : "transparent"}`,
                background: "transparent",
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────────── */}
      <div className="px-6 py-5">
        {!hasData ? (
          <div className="rounded-xl border bg-white px-6 py-12 text-center" style={{ borderColor: C.border }}>
            <p className="text-sm font-medium" style={{ color: C.text }}>No data to display</p>
            <p className="text-xs mt-1" style={{ color: C.muted }}>
              {dataSource.error ? "Check ONA credentials and form ID." : "No batches match the selected date range."}
            </p>
          </div>
        ) : activeTab === "production" ? (
          <TabProduction df={df} siteTrends={siteTrends} operatorScores={operatorScores} />
        ) : activeTab === "quality" ? (
          <TabQuality df={df} />
        ) : activeTab === "operations" ? (
          <TabOperations df={df} drillFilter={drillFilter} onClearDrill={() => setDrillFilter(null)} />
        ) : (
          <TabRecords df={df} kpis={kpis} dateFrom={dateFrom} dateTo={dateTo} />
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="px-6 pb-6">
        <div className="rounded-xl border bg-white px-4 py-3" style={{ borderColor: C.border }}>
          <div className="flex flex-wrap gap-3 text-xs" style={{ color: C.muted }}>
            <span>ONA form {dataSource.formId ?? "not configured"}</span>
            <span>·</span>
            <span>Loaded {new Date(dataSource.loadedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
            <span>·</span>
            <span>{allBatches.length} total batches</span>
          </div>
        </div>
      </footer>

      {/* ── Overlay backdrop ───────────────────────────────────────── */}
      {openPanel && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.15)" }}
          onClick={() => setOpenPanel(null)}
        />
      )}

      {/* ── Decision Snapshot drawer ───────────────────────────────── */}
      <aside
        className="fixed top-0 right-0 h-full z-50 flex flex-col bg-white shadow-2xl transition-transform duration-200"
        style={{
          width: 420,
          borderLeft: `1px solid ${C.border}`,
          transform: openPanel === "snapshot" ? "translateX(0)" : "translateX(100%)",
        }}>
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: C.border }}>
          <h2 className="text-sm font-semibold" style={{ color: C.text }}>Decision Snapshot</h2>
          <button onClick={() => setOpenPanel(null)}
            className="text-xs px-2.5 py-1 rounded border hover:bg-stone-50 transition-colors"
            style={{ borderColor: C.border, color: C.muted }}>
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: C.danger }}>
              Critical ({snapshot.critical.length})
            </p>
            {snapshot.critical.length === 0 ? (
              <p className="text-sm" style={{ color: C.muted }}>No critical issues in current period.</p>
            ) : (
              <div className="space-y-2">
                {snapshot.critical.map((item, i) => (
                  <div key={i} className="rounded-lg px-3 py-2.5 text-sm"
                    style={{ background: C.dangerBg, borderLeft: `3px solid ${C.danger}` }}>
                    <p className="font-semibold" style={{ color: C.danger }}>{item.type}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{item.site}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.text }}>{item.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: C.warning }}>
              Warnings ({snapshot.warnings.length})
            </p>
            {snapshot.warnings.length === 0 ? (
              <p className="text-sm" style={{ color: C.muted }}>No warnings in current period.</p>
            ) : (
              <div className="space-y-2">
                {snapshot.warnings.map((item, i) => (
                  <div key={i} className="rounded-lg px-3 py-2.5 text-sm"
                    style={{ background: C.warningBg, borderLeft: `3px solid ${C.warning}` }}>
                    <p className="font-semibold" style={{ color: C.warning }}>{item.type}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{item.site}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.text }}>{item.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Ask AI drawer ──────────────────────────────────────────── */}
      <aside
        className="fixed top-0 right-0 h-full z-50 flex flex-col bg-white shadow-2xl transition-transform duration-200"
        style={{
          width: 420,
          borderLeft: `1px solid ${C.border}`,
          transform: openPanel === "ai" ? "translateX(0)" : "translateX(100%)",
        }}>
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: C.border }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: C.text }}>Ask AI</h2>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>Questions answered from current KPI data</p>
          </div>
          <button onClick={() => setOpenPanel(null)}
            className="text-xs px-2.5 py-1 rounded border hover:bg-stone-50 transition-colors"
            style={{ borderColor: C.border, color: C.muted }}>
            Close
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {aiMessages.length === 0 && (
            <div className="space-y-2 pt-2">
              {[
                "Which kiln has the most compliance failures?",
                "What is the average pyrolysis duration?",
                "How many batches were produced this month?",
              ].map(q => (
                <button key={q} onClick={() => setAiInput(q)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border hover:bg-stone-50 transition-colors"
                  style={{ borderColor: C.border, color: C.muted }}>
                  {q}
                </button>
              ))}
            </div>
          )}
          {aiMessages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm"
                style={{
                  background: m.role === "user" ? C.brand : "#f4f4f3",
                  color: m.role === "user" ? "#fff" : C.text,
                }}>
                {m.content}
              </div>
            </div>
          ))}
          {aiLoading && (
            <div className="flex justify-start">
              <div className="rounded-xl px-3 py-2 text-sm" style={{ background: "#f4f4f3", color: C.muted }}>
                Thinking…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t flex gap-2 flex-shrink-0" style={{ borderColor: C.border }}>
          <input
            ref={aiInputRef}
            type="text"
            value={aiInput}
            onChange={e => setAiInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendAiMessage()}
            placeholder="Ask about the data…"
            className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
            style={{ borderColor: C.border }}
            disabled={aiLoading}
          />
          <button
            onClick={sendAiMessage}
            disabled={aiLoading || !aiInput.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-40"
            style={{ background: C.brand }}>
            Send
          </button>
        </div>
      </aside>
    </div>
  );
}
