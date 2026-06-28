import { redirect } from "next/navigation";
import { isAdmin, authRequired } from "@/lib/admin-auth";
import { getAdminDonations, getAdminStats } from "@/server/admin";
import { formatPaise } from "@/lib/format";
import { AdminTable } from "@/features/admin/AdminTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const [stats, donations] = await Promise.all([getAdminStats(), getAdminDonations()]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Admin</h1>
          <p className="text-sm text-zinc-500">
            {authRequired ? "Authenticated session" : "Open access (AUTH_ENABLED=false)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/export"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-200"
          >
            Export CSV
          </a>
          <a
            href="/"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-200"
          >
            View site
          </a>
        </div>
      </div>

      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Raised" value={formatPaise(stats.totalRaisedPaise)} />
        <Stat label="Contributors" value={String(stats.contributors)} />
        <Stat label="Countries" value={String(stats.countries)} />
        <Stat label="Hidden / Rejected" value={String(stats.byModeration.HIDDEN + stats.byModeration.REJECTED)} />
      </section>

      <AdminTable initial={donations} authRequired={authRequired} />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{label}</div>
    </div>
  );
}
