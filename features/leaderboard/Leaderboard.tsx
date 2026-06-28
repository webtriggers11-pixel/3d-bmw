"use client";

import { useQuery } from "@tanstack/react-query";
import { formatPaise } from "@/lib/format";
import type { LeaderEntry } from "@/server/donations";

async function fetchLeaderboard(): Promise<{ top: LeaderEntry[]; recent: LeaderEntry[] }> {
  const res = await fetch("/api/leaderboard");
  if (!res.ok) throw new Error("Failed to load leaderboard");
  return res.json();
}

export function Leaderboard() {
  const { data } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    refetchInterval: 30_000,
  });

  const top = data?.top ?? [];
  const recent = data?.recent ?? [];

  return (
    <section className="grid gap-3">
      <Panel title="Top contributors" empty="No contributions yet — be the first.">
        {top.map((d, i) => (
          <Row key={d.id} rank={i + 1} entry={d} showAmount />
        ))}
      </Panel>
      <Panel title="Recent names" empty="New names will appear here live.">
        {recent.map((d) => (
          <Row key={d.id} entry={d} />
        ))}
      </Panel>
    </section>
  );
}

function Panel({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h3>
      {children.length === 0 ? (
        <p className="text-sm text-zinc-400">{empty}</p>
      ) : (
        <ul className="space-y-2">{children}</ul>
      )}
    </div>
  );
}

function Row({
  rank,
  entry,
  showAmount,
}: {
  rank?: number;
  entry: LeaderEntry;
  showAmount?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 truncate text-zinc-800 dark:text-zinc-200">
        {rank && <span className="w-5 text-zinc-400">{rank}</span>}
        <span className="truncate font-medium">{entry.name}</span>
        {entry.country && <span className="text-zinc-400">· {entry.country}</span>}
      </span>
      {showAmount && (
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {formatPaise(entry.amount)}
        </span>
      )}
    </li>
  );
}
