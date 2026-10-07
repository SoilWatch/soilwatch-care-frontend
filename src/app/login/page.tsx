"use client";

import { useState, FormEvent, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

function Field({
  label, type = "text", value, onChange, placeholder, autoComplete,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; autoComplete?: string;
}) {
  const id = useId();
  const [show, setShow] = useState(false);
  const { t } = useLanguage();
  const inputType = type === "password" ? (show ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium" style={{ color: "#57534e" }}>
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
            "w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors",
            "placeholder:text-stone-400",
            "focus:ring-2 focus:border-stone-400",
            type === "password" ? "pr-10" : "",
          ].join(" ")}
          style={{ borderColor: "#d6d3d1", background: "#fff", color: "#1c1917" }}
        />
        {type === "password" && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: "#a8a29e" }}
            aria-label={show ? t("login.hidePassword") : t("login.showPassword")}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg border px-3 py-2.5 text-sm"
      style={{ background: "#fef2f2", borderColor: "#fca5a5", color: "#b91c1c" }}>
      {msg}
    </div>
  );
}

export default function LoginPage() {
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "#f5f5f4" }}>

      {/* Logo + wordmark */}
      <div className="mb-7 flex flex-col items-center gap-3">
        <Image
          src="/soilwatch-logo.jpg"
          alt="SoilWatch"
          width={44}
          height={44}
          className="rounded-lg object-contain"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}
        />
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: "#1c1917" }}>{t("login.brand")}</p>
          <p className="text-xs mt-0.5" style={{ color: "#78716c" }}>{t("login.subtitle")}</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-xl border bg-white px-6 py-6"
        style={{ borderColor: "#e7e5e4", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>

        <h1 className="text-base font-semibold mb-5" style={{ color: "#1c1917" }}>
          {t("login.form.subtitle")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorBanner msg={error} />}
          <Field
            label={t("login.field.email")}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder={t("login.placeholder.email")}
            autoComplete="email"
          />
          <Field
            label={t("login.field.password")}
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={t("login.placeholder.password")}
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-60"
            style={{ background: "#1c1917" }}
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" />{t("login.signingIn")}</>
              : t("login.signIn")
            }
          </button>
        </form>

        <p className="mt-5 text-center text-xs" style={{ color: "#a8a29e" }}>
          {t("login.noAccount")}{" "}
          <Link href="/register" className="font-medium underline transition-opacity hover:opacity-70"
            style={{ color: "#1c1917" }}>
            {t("login.createAccount")}
          </Link>
        </p>
      </div>

      {/* Language switcher */}
      <div className="mt-6 w-40">
        <LanguageSwitcher variant="light" />
      </div>

      <p className="mt-5 text-xs" style={{ color: "#a8a29e" }}>
        {t("login.footer")}
      </p>
    </div>
  );
}
