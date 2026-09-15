import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ProfilePanel from "./ProfilePanel";

export const dynamic = "force-dynamic";

const C = {
  border: "#e7e5e4", text: "#1c1917", muted: "#78716c", bg: "#fafaf8",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-full" style={{ background: C.bg }}>
      <header className="border-b bg-white px-6 py-5" style={{ borderColor: C.border }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
          Account
        </p>
        <h1 className="text-xl font-semibold mt-0.5" style={{ color: C.text }}>
          Profile
        </h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>
          Your account details and security settings.
        </p>
      </header>

      <div className="px-6 py-6 max-w-xl">
        <ProfilePanel
          name={session.name ?? ""}
          email={session.email}
          role={session.role}
        />
      </div>
    </div>
  );
}
