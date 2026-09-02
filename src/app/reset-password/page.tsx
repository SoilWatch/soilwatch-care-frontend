"use client";

import { useState, FormEvent, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

function PasswordField({ label, value, onChange, placeholder, autoComplete }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; autoComplete?: string;
}) {
  const id   = useId();
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-500">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={show ? t("login.hidePassword") : t("login.showPassword")}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
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

function validatePassword(pw: string): string | null {
  if (pw.length < 8)                           return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw))                       return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(pw))                       return "Password must contain at least one digit.";
  return null;
}

export default function ResetPasswordPage() {
  const { t } = useLanguage();

  const token = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("token") ?? ""
    : "";

  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(t("resetPassword.error.invalidToken"));
      return;
    }

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }

    if (password !== confirm) {
      setError(t("resetPassword.error.mismatch"));
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("resetPassword.error.invalidToken"));
        return;
      }
      setSuccess(true);
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
        {success ? (
          <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
            <CheckCircle size={36} className="text-green-500" />
            <h1 className="text-sm font-bold text-slate-800">{t("resetPassword.success.title")}</h1>
            <p className="text-xs text-slate-500 leading-relaxed">{t("resetPassword.success.subtitle")}</p>
            <Link
              href="/login"
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)" }}
            >
              {t("login.signIn")} <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <>
            <div className="px-6 pt-5 pb-1">
              <h1 className="text-sm font-bold text-slate-800">{t("resetPassword.title")}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{t("resetPassword.subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && <ErrorBanner msg={error} />}

              {!token && (
                <ErrorBanner msg={t("resetPassword.error.invalidToken")} />
              )}

              <PasswordField
                label={t("resetPassword.field.newPassword")}
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <PasswordField
                label={t("resetPassword.field.confirmPassword")}
                value={confirm}
                onChange={setConfirm}
                placeholder="••••••••"
                autoComplete="new-password"
              />

              <p className="text-[11px] text-slate-400">{t("resetPassword.hint")}</p>

              <button
                type="submit"
                disabled={loading || !password || !confirm || !token}
                className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)" }}
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" />{t("resetPassword.submitting")}</>
                  : <><span>{t("resetPassword.submit")}</span><ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></>
                }
              </button>

              <Link
                href="/login"
                className="flex justify-center text-xs text-slate-400 hover:text-slate-600 transition-colors pt-1"
              >
                {t("resetPassword.back")}
              </Link>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-xs" style={{ color: "#cbd5e1" }}>{t("login.footer")}</p>
    </div>
  );
}
