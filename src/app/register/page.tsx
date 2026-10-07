"use client";

import { useState, FormEvent, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, ArrowRight, Loader2, Mail } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

function TextField({
  label, value, onChange, placeholder, autoComplete, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; autoComplete?: string; type?: string;
}) {
  const id = useId();
  const [show, setShow] = useState(false);
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
            "placeholder:text-stone-400 focus:ring-2 focus:border-stone-400",
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
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg border px-3 py-2.5 text-sm"
      style={{ background: "#fef2f2", borderColor: "#fca5a5", color: "#b91c1c" }}>
      {msg}
    </div>
  );
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8)       return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw))  return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(pw))  return "Password must contain at least one digit.";
  return null;
}

export default function RegisterPage() {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) { setError(t("register.error.fullNameRequired")); return; }

    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return; }

    if (password !== confirm) { setError(t("register.error.mismatch")); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t("register.error.failed")); return; }
      setDone(true);
    } catch {
      setError(t("login.error.network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "#f5f5f4" }}>

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

      <div className="w-full max-w-sm rounded-xl border bg-white px-6 py-6"
        style={{ borderColor: "#e7e5e4", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: "#f0fdf4" }}>
              <Mail size={20} style={{ color: "#16a34a" }} />
            </div>
            <h1 className="text-sm font-semibold" style={{ color: "#1c1917" }}>
              {t("register.success.title")}
            </h1>
            <p className="text-xs leading-relaxed" style={{ color: "#78716c" }}>
              {t("register.success.subtitle")}
            </p>
            <Link
              href="/login"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-80"
              style={{ background: "#1c1917" }}
            >
              {t("login.signIn")} <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-base font-semibold mb-1" style={{ color: "#1c1917" }}>
              {t("register.title")}
            </h1>
            <p className="text-xs mb-5" style={{ color: "#a8a29e" }}>{t("register.subtitle")}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <ErrorBanner msg={error} />}
              <TextField
                label={t("login.field.fullName")}
                value={fullName}
                onChange={setFullName}
                placeholder={t("login.placeholder.fullName")}
                autoComplete="name"
              />
              <TextField
                label={t("login.field.email")}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder={t("login.placeholder.email")}
                autoComplete="email"
              />
              <TextField
                label={t("login.field.password")}
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <TextField
                label={t("login.field.confirmPassword")}
                type="password"
                value={confirm}
                onChange={setConfirm}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <p className="text-[11px]" style={{ color: "#a8a29e" }}>
                {t("register.hint")}
              </p>
              <button
                type="submit"
                disabled={loading || !fullName || !email || !password || !confirm}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-60"
                style={{ background: "#1c1917" }}
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" />{t("register.submitting")}</>
                  : <>{t("register.submit")} <ArrowRight size={13} /></>
                }
              </button>
            </form>

            <p className="mt-5 text-center text-xs" style={{ color: "#a8a29e" }}>
              {t("register.haveAccount")}{" "}
              <Link href="/login" className="font-medium underline transition-opacity hover:opacity-70"
                style={{ color: "#1c1917" }}>
                {t("login.signIn")}
              </Link>
            </p>
          </>
        )}
      </div>

      <div className="mt-6 w-40">
        <LanguageSwitcher variant="light" />
      </div>

      <p className="mt-5 text-xs" style={{ color: "#a8a29e" }}>
        {t("login.footer")}
      </p>
    </div>
  );
}
