"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";

const C = {
  text:    "#1c1917",
  muted:   "#78716c",
  border:  "#e7e5e4",
  bg:      "#fafaf8",
  brand:   "#c2410c",
  success: "#15803d",
  danger:  "#b91c1c",
};

const ROLE_LABEL: Record<string, string> = {
  admin:           "Administrator",
  user:            "User",
  project_officer: "Project Officer",
  supervisor:      "Supervisor",
  certifier:       "Certifier",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

interface Props {
  name:  string;
  email: string;
  role:  string;
}

export default function ProfilePanel({ name, email, role }: Props) {
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw,     setNewPw]       = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [loading,   setLoading]     = useState(false);
  const [success,   setSuccess]     = useState(false);
  const [error,     setError]       = useState("");

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPw.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setSuccess(true);
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card style={{ borderColor: C.border }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-semibold text-white"
              style={{ background: C.brand }}
            >
              {initials(name || email)}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold truncate" style={{ color: C.text }}>
                {name}
              </p>
              <p className="text-sm truncate mt-0.5" style={{ color: C.muted }}>
                {email}
              </p>
              <span
                className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: role === "admin" ? "#fef3c7" : "#f5f5f4",
                  color:      role === "admin" ? "#92400e" : C.muted,
                }}
              >
                {ROLE_LABEL[role] ?? role}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card style={{ borderColor: C.border }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={15} style={{ color: C.muted }} />
            <h2 className="text-sm font-semibold" style={{ color: C.text }}>
              Change Password
            </h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>
                Current password
              </label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-700/20 focus:border-orange-700"
                style={{ borderColor: C.border, color: C.text }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>
                New password
              </label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-700/20 focus:border-orange-700"
                style={{ borderColor: C.border, color: C.text }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-700/20 focus:border-orange-700"
                style={{ borderColor: C.border, color: C.text }}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm"
                style={{ background: "#fef2f2", color: C.danger }}>
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
                style={{ background: "#f0fdf4", color: C.success }}>
                <CheckCircle2 size={14} className="flex-shrink-0" />
                <span>Password updated successfully.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-60"
              style={{ background: C.brand }}
            >
              {loading ? "Saving…" : "Update password"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
