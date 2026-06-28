import { CarViewer } from "@/features/viewer/CarViewer";
import { AddNameButton } from "@/features/donate/AddNameButton";
import { DonationModal } from "@/features/donate/DonationModal";
import { ConsentModal } from "@/features/consent/ConsentModal";
import { Leaderboard } from "@/features/leaderboard/Leaderboard";
import { getCarsWithNames } from "@/server/cars";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cars = await getCarsWithNames();
  const totalNames = cars.reduce((sum, c) => sum + c.names.length, 0);
  const totalSpots = cars.reduce((sum, c) => sum + c.totalAnchors, 0);
  const spotsLeft = totalSpots - totalNames;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-4 sm:px-6 lg:h-[100dvh] lg:overflow-hidden lg:py-5">
      {/* Header */}
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            For fun &amp; contribution
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 lg:text-3xl dark:text-zinc-50">
            Put your name on the car.
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-zinc-500 sm:inline">
            {totalNames} names · {spotsLeft} spots left
          </span>
          <AddNameButton className="flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
            Add my name
          </AddNameButton>
        </div>
      </header>

      {/* Body: viewer (hero) + leaderboard sidebar */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="h-[56vh] min-h-[300px] lg:h-full">
          <CarViewer />
        </div>

        <aside className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto lg:pr-1">
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Names" value={totalNames} />
            <MiniStat label="Spots left" value={spotsLeft} />
            <MiniStat label="Cars" value={cars.length} />
          </div>
          <Leaderboard />
        </aside>
      </div>

      {/* Disclosure */}
      <footer className="mt-3 shrink-0 text-center text-[11px] leading-relaxed text-zinc-400">
        For fun · contributions support this project (not a registered charity) ·
        not affiliated with or endorsed by BMW.
      </footer>

      <ConsentModal />
      <DonationModal />
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {value.toLocaleString()}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
    </div>
  );
}
