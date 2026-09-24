"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Status = "loading" | "success" | "error" | "resent";

export default function VerifyEmailPage() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token") ?? "";

    if (!token) {
      setErrorMsg(t("verifyEmail.error.noToken"));
      setStatus("error");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error ?? t("verifyEmail.error.invalid"));
          setStatus("error");
        } else {
          setStatus("success");
        }
      })
      .catch(() => {
        setErrorMsg(t("login.error.network"));
        setStatus("error");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleResend(e: FormEvent) {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
      setStatus("resent");
    } catch {
      // still show resent to avoid enumeration
      setStatus("resent");
    } finally {
      setResending(false);
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

      <div className="w-full max-w-sm rounded-xl border bg-white px-6 py-8"
        style={{ borderColor: "#e7e5e4", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 size={28} className="animate-spin" style={{ color: "#a8a29e" }} />
            <p className="text-sm" style={{ color: "#78716c" }}>{t("verifyEmail.verifying")}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle size={36} style={{ color: "#16a34a" }} />
            <h1 className="text-base font-semibold" style={{ color: "#1c1917" }}>
              {t("verifyEmail.success.title")}
            </h1>
            <p className="text-xs leading-relaxed" style={{ color: "#78716c" }}>
              {t("verifyEmail.success.subtitle")}
            </p>
            <Link
              href="/login"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-80"
              style={{ background: "#1c1917" }}
            >
              {t("login.signIn")} <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 text-center">
            <XCircle size={36} style={{ color: "#dc2626" }} />
            <h1 className="text-base font-semibold" style={{ color: "#1c1917" }}>
              {t("verifyEmail.error.title")}
            </h1>
            <p className="text-xs leading-relaxed" style={{ color: "#78716c" }}>
              {errorMsg || t("verifyEmail.error.invalid")}
            </p>

            <form onSubmit={handleResend} className="mt-3 w-full space-y-2">
              <p className="text-xs font-medium text-left" style={{ color: "#57534e" }}>
                {t("verifyEmail.resend.label")}
              </p>
              <input
                type="email"
                value={resendEmail}
                onChange={e => setResendEmail(e.target.value)}
                placeholder={t("login.placeholder.email")}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-stone-400 focus:ring-2 focus:border-stone-400"
                style={{ borderColor: "#d6d3d1", background: "#fff", color: "#1c1917" }}
              />
              <button
                type="submit"
                disabled={resending || !resendEmail.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-60"
                style={{ background: "#1c1917" }}
              >
                {resending
                  ? <><Loader2 size={14} className="animate-spin" />{t("verifyEmail.resend.sending")}</>
                  : t("verifyEmail.resend.submit")
                }
              </button>
            </form>

            <Link href="/login" className="text-xs underline transition-opacity hover:opacity-70"
              style={{ color: "#a8a29e" }}>
              {t("resetPassword.back")}
            </Link>
          </div>
        )}

        {status === "resent" && (
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle size={36} style={{ color: "#16a34a" }} />
            <h1 className="text-base font-semibold" style={{ color: "#1c1917" }}>
              {t("verifyEmail.resent.title")}
            </h1>
            <p className="text-xs leading-relaxed" style={{ color: "#78716c" }}>
              {t("verifyEmail.resent.subtitle")}
            </p>
            <Link href="/login" className="mt-2 text-xs underline transition-opacity hover:opacity-70"
              style={{ color: "#a8a29e" }}>
              {t("resetPassword.back")}
            </Link>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs" style={{ color: "#a8a29e" }}>
        {t("login.footer")}
      </p>
    </div>
  );
}
