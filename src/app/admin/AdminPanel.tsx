"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

const C = {
  border: "#e7e5e4", text: "#1c1917", muted: "#78716c",
  success: "#15803d", danger: "#b91c1c", brand: "#c2410c",
};

interface Role { id: string; name: string; description: string | null }
interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role: Role | null;
}

const ROLE_LABEL: Record<string, string> = {
  administrator:   "Administrator",
  project_officer: "Project Officer",
  supervisor:      "Supervisor",
  certifier:       "Certifier",
  user:            "User",
};

export default function AdminPanel({
  initialUsers,
  roles,
}: {
  initialUsers: User[];
  roles: Role[];
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [assigningRole, setAssigningRole] = useState<Record<string, boolean>>({});

  async function changeRole(userId: string, newRoleId: string) {
    setAssigningRole(p => ({ ...p, [userId]: true }));
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: newRoleId || null }),
      });
      if (res.ok) {
        const updated: User = await res.json();
        setUsers(prev => prev.map(u => u.id === userId ? updated : u));
      }
    } finally {
      setAssigningRole(p => ({ ...p, [userId]: false }));
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role_id: roleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ ok: false, msg: data.detail ?? data.error ?? "Failed to send invite." });
      } else {
        setFeedback({ ok: true, msg: `Invite sent to ${email.trim().toLowerCase()}.` });
        setEmail("");
        const usersRes = await fetch("/api/admin/users");
        if (usersRes.ok) setUsers(await usersRes.json());
      }
    } catch {
      setFeedback({ ok: false, msg: "Network error — check your connection." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-4 pb-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: C.muted }}>
            Invite User
          </p>
          <form onSubmit={sendInvite} className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-48">
              <label className="text-xs font-medium" style={{ color: C.muted }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400"
                style={{ borderColor: C.border, color: C.text }}
              />
            </div>
            <div className="flex flex-col gap-1 min-w-44">
              <label className="text-xs font-medium" style={{ color: C.muted }}>Role</label>
              <select
                value={roleId}
                onChange={e => setRoleId(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 bg-white"
                style={{ borderColor: C.border, color: C.text }}
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {ROLE_LABEL[r.name] ?? r.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
              style={{ background: C.brand }}
            >
              {submitting ? "Sending…" : "Send Invite"}
            </button>
          </form>
          {feedback && (
            <p className="mt-3 text-sm" style={{ color: feedback.ok ? C.success : C.danger }}>
              {feedback.msg}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: C.muted }}>
            Users ({users.length})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: C.muted }}>
                  <th className="text-left py-2 pr-6 font-medium text-xs">Name</th>
                  <th className="text-left py-2 pr-6 font-medium text-xs">Email</th>
                  <th className="text-left py-2 pr-6 font-medium text-xs">Role</th>
                  <th className="text-left py-2 font-medium text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t" style={{ borderColor: C.border }}>
                    <td className="py-2.5 pr-6 font-medium" style={{ color: C.text }}>{u.full_name}</td>
                    <td className="py-2.5 pr-6" style={{ color: C.muted }}>{u.email}</td>
                    <td className="py-2.5 pr-6">
                      <select
                        value={u.role?.id ?? ""}
                        disabled={assigningRole[u.id]}
                        onChange={e => changeRole(u.id, e.target.value)}
                        className="border rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-stone-400 bg-white disabled:opacity-50"
                        style={{ borderColor: C.border, color: C.text }}
                      >
                        <option value="">— No role —</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>
                            {ROLE_LABEL[r.name] ?? r.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded"
                        style={{
                          background: u.is_active ? "#f0fdf4" : "#fef2f2",
                          color: u.is_active ? C.success : C.danger,
                        }}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm" style={{ color: C.muted }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
