"use client";

import { useState, FormEvent, useId } from "react";
import Image from "next/image";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// ── Shared input ────────────────────────────────────────────────────────────
function Field({
  label, type = "text", value, onChange, placeholder, hint, autoComplete,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; autoComplete?: string;
}) {
  const { t } = useLanguage();
  const id = useId();
  const [show, setShow] = useState(false);
  const inputType = type === "password" ? (show ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-500">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={[
            "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none",
            "transition-all placeholder:text-slate-400",
            "focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30",
            type === "password" ? "pr-11" : "",
          ].join(" ")}
        />
        {type === "password" && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={show ? t("login.hidePassword") : t("login.showPassword")}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
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

// ── Sign-in form ────────────────────────────────────────────────────────────
function SignInForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t("login.error.loginFailed")); return; }
      window.location.href = "/";
    } catch {
      setError(t("login.error.network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner msg={error} />}
      <Field label={t("login.field.email")} type="email" value={email} onChange={setEmail}
        placeholder={t("login.placeholder.email")} autoComplete="email" />
      <Field label={t("login.field.password")} type="password" value={password} onChange={setPassword}
        placeholder={t("login.placeholder.password")} autoComplete="current-password" />
      <button
        type="submit"
        disabled={loading}
        className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)" }}
      >
        {loading
          ? <><Loader2 size={15} className="animate-spin" />{t("login.signingIn")}</>
          : <><span>{t("login.signIn")}</span><ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></>
        }
      </button>
    </form>
  );
}

// ── Register form ───────────────────────────────────────────────────────────
function RegisterForm({ onRegistered }: { onRegistered: () => void }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirm }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t("login.error.registrationFailed")); return; }
      onRegistered();
    } catch {
      setError(t("login.error.network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-slate-400 leading-relaxed">
        {t("login.registerNotice.prefix")}{" "}
        <span className="font-medium text-slate-500">@soilwatch.eu · @care.org · @care.et</span>.
        {" "}{t("login.registerNotice.suffix")}
      </p>
      {error && <ErrorBanner msg={error} />}
      <Field label={t("login.field.fullName")} value={name} onChange={setName}
        placeholder={t("login.placeholder.fullName")} autoComplete="name" />
      <Field label={t("login.field.email")} type="email" value={email} onChange={setEmail}
        placeholder={t("login.placeholder.email")} autoComplete="email" />
      <Field label={t("login.field.password")} type="password" value={password} onChange={setPassword}
        hint={t("login.field.passwordHint")} autoComplete="new-password" />
      <Field label={t("login.field.confirmPassword")} type="password" value={confirm} onChange={setConfirm}
        autoComplete="new-password" />
      <button
        type="submit"
        disabled={loading}
        className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)" }}
      >
        {loading
          ? <><Loader2 size={15} className="animate-spin" />{t("login.creatingAccount")}</>
          : <><span>{t("login.createAccount")}</span><ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></>
        }
      </button>
    </form>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"signin" | "register">("signin");
  const [registered, setRegistered] = useState(false);

  function handleRegistered() {
    setRegistered(true);
    setTab("signin");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "#f1f5f9" }}>

      {/* Language switcher */}
      <div className="w-full max-w-sm mb-6 flex justify-center">
        <div className="w-40">
          <LanguageSwitcher variant="light" />
        </div>
      </div>

      {/* Logo + wordmark */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image
          src="/soilwatch-logo.jpg"
          alt="SoilWatch"
          width={48}
          height={48}
          className="rounded-xl object-contain shadow-sm"
        />
        <div className="text-center">
          <p className="font-bold text-base" style={{ color: "#0f172a" }}>{t("login.brand")}</p>
          <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
            {t("login.subtitle")}
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        {/* Tab toggle */}
        <div className="flex border-b border-slate-100">
          {(["signin", "register"] as const).map(tabId => (
            <button
              key={tabId}
              type="button"
              onClick={() => setTab(tabId)}
              className="flex-1 py-3.5 text-sm font-medium transition-colors"
              style={{
                color: tab === tabId ? "#0f172a" : "#94a3b8",
                borderBottom: tab === tabId ? "2px solid #0f172a" : "2px solid transparent",
                background: "transparent",
              }}
            >
              {tabId === "signin" ? t("login.tab.signin") : t("login.tab.register")}
            </button>
          ))}
        </div>

        <div className="px-6 py-6">
          {registered && tab === "signin" && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-500" />
              {t("login.registered")}
            </div>
          )}
          {tab === "signin"
            ? <SignInForm />
            : <RegisterForm onRegistered={handleRegistered} />
          }
        </div>
      </div>

      <p className="mt-6 text-xs" style={{ color: "#cbd5e1" }}>
        {t("login.footer")}
      </p>
    </div>
  );
}
