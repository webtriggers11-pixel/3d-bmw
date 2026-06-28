"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { formatPaise } from "@/lib/format";
import type { AdminDonation, ModerationStatus } from "@/types";

const STATUS_FILTERS: (ModerationStatus | "ALL")[] = [
  "ALL",
  "APPROVED",
  "HIDDEN",
  "REJECTED",
  "PENDING",
];

const BADGE: Record<ModerationStatus, string> = {
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  HIDDEN: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  PENDING: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

export function AdminTable({
  initial,
  authRequired,
}: {
  initial: AdminDonation[];
  authRequired: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ModerationStatus | "ALL">("ALL");
  const [busy, setBusy] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-donations", query, status],
    queryFn: async (): Promise<AdminDonation[]> => {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (status !== "ALL") params.set("status", status);
      const res = await fetch(`/api/admin/donations?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      return (await res.json()).donations;
    },
    initialData: query === "" && status === "ALL" ? initial : undefined,
  });

  const rows = data ?? [];

  async function act(id: string, action: () => Promise<Response>) {
    setBusy(id);
    try {
      await action();
      await queryClient.invalidateQueries({ queryKey: ["admin-donations"] });
      router.refresh(); // refresh server stats
    } finally {
      setBusy(null);
    }
  }

  const setMod = (id: string, moderation: ModerationStatus) =>
    act(id, () =>
      fetch(`/api/admin/donations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moderation }),
      }),
    );

  const del = (id: string) => {
    if (!confirm("Delete this name and free its spot?")) return;
    act(id, () => fetch(`/api/admin/donations/${id}`, { method: "DELETE" }));
  };

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search name, country, message…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-sm ${
                status === s
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                  : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {authRequired && (
          <button
            onClick={logout}
            className="ml-auto rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            Log out
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
            <tr>
              <Th>Name</Th>
              <Th>Amount</Th>
              <Th>Size</Th>
              <Th>Anchor</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No donations.
                </td>
              </tr>
            ) : (
              rows.map((d) => (
                <tr key={d.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">{d.name}</div>
                    {d.country && <div className="text-xs text-zinc-400">{d.country}</div>}
                    {d.message && (
                      <div className="max-w-xs truncate text-xs text-zinc-500">{d.message}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatPaise(d.amount)}</td>
                  <td className="px-4 py-3">{d.size}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    car {d.carIndex} · {d.anchorKey}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE[d.moderation]}`}>
                      {d.moderation}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {d.moderation !== "APPROVED" && (
                        <Action label="Approve" onClick={() => setMod(d.id, "APPROVED")} busy={busy === d.id} />
                      )}
                      {d.moderation !== "HIDDEN" && (
                        <Action label="Hide" onClick={() => setMod(d.id, "HIDDEN")} busy={busy === d.id} />
                      )}
                      {d.moderation !== "REJECTED" && (
                        <Action label="Reject" onClick={() => setMod(d.id, "REJECTED")} busy={busy === d.id} />
                      )}
                      <Action label="Delete" danger onClick={() => del(d.id)} busy={busy === d.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

function Action({
  label,
  onClick,
  busy,
  danger,
}: {
  label: string;
  onClick: () => void;
  busy: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`rounded-full border px-2.5 py-1 text-xs disabled:opacity-50 ${
        danger
          ? "border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
          : "border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      }`}
    >
      {label}
    </button>
  );
}
