"use client";

import { useState, FormEvent, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-500">{label}</label>
      <input
        id={id}
        type="email"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="email"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30"
      />
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      {msg}
    </div>
  );
}

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("login.error.network"));
        return;
      }
      setSent(true);
    } catch {
      setError(t("login.error.network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "#f1f5f9" }}>
      <div className="w-full max-w-sm mb-6 flex justify-center">
        <div className="w-40">
          <LanguageSwitcher variant="light" />
        </div>
      </div>

      <div className="mb-8 flex flex-col items-center gap-3">
        <Image src="/soilwatch-logo.jpg" alt="SoilWatch" width={48} height={48} className="rounded-xl object-contain shadow-sm" />
        <div className="text-center">
          <p className="font-bold text-base" style={{ color: "#0f172a" }}>{t("login.brand")}</p>
          <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{t("login.subtitle")}</p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {sent ? (
          <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
            <CheckCircle size={36} className="text-green-500" />
            <h1 className="text-sm font-bold text-slate-800">{t("forgotPassword.success.title")}</h1>
            <p className="text-xs text-slate-500 leading-relaxed">{t("forgotPassword.success.subtitle")}</p>
            <Link
              href="/login"
              className="mt-2 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
            >
              {t("forgotPassword.back")}
            </Link>
          </div>
        ) : (
          <>
            <div className="px-6 pt-5 pb-1">
              <h1 className="text-sm font-bold text-slate-800">{t("forgotPassword.title")}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{t("forgotPassword.subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && <ErrorBanner msg={error} />}
              <Field
                label={t("login.field.email")}
                value={email}
                onChange={setEmail}
                placeholder={t("login.placeholder.email")}
              />
              <button
                type="submit"
                disabled={loading || !email}
                className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)" }}
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" />{t("forgotPassword.submitting")}</>
                  : <><span>{t("forgotPassword.submit")}</span><ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></>
                }
              </button>
              <Link
                href="/login"
                className="flex justify-center text-xs text-slate-400 hover:text-slate-600 transition-colors pt-1"
              >
                {t("forgotPassword.back")}
              </Link>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-xs" style={{ color: "#cbd5e1" }}>{t("login.footer")}</p>
    </div>
  );
}
