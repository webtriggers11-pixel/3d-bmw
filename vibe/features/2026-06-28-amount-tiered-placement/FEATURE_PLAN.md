# FEATURE_PLAN — Amount-tiered placement + live spot preview

> Spec: ./FEATURE_SPEC.md · Date: 2026-06-28
> Conventions from vibe/CODEBASE.md §6 + vibe/ARCHITECTURE.md. Next.js 16 App Router.

---

## 1. Impact map

**New files**
- `lib/placement.ts` — zone defs, size→zone eligibility, prominence ranking, candidate selection (pure, client-safe).
- `app/api/placement/preview/route.ts` — `GET` candidate placement for an amount.
- `server/placement.ts` — server-side candidate/eligible-key helpers reused by allocation + preview.
- `features/viewer/PreviewName.tsx` — ghost name + highlight rendered in the Canvas.
- `tests/placement.test.ts` — unit tests for zone/eligibility/allocation logic.

**Modified files**
- `server/positions.ts` — `reserveFreePosition(carId, size)` becomes zone-aware.
- `app/api/donations/create-order/route.ts` — pass `size`; emit upgrade-nudge 409.
- `store/useDonationModal.ts` — add live draft (`name`, `amountPaise`, setters).
- `features/donate/DonationModal.tsx` — drawer layout; write draft to store as fields change.
- `features/viewer/CarViewer.tsx` — read draft, query preview, render `PreviewName`.
- `types/index.ts` — add `Zone`, `PreviewPlacement`.
- `lib/format.ts` — (maybe) helper for the upgrade-nudge string. Optional.

## 2. Files explicitly out of scope — DO NOT TOUCH
- `server/positions.ts#finalizePaidDonation` (allocation-on-pay contract unchanged).
- `app/api/razorpay/webhook/route.ts`, `app/api/dev/confirm/route.ts`.
- Prisma schema / migrations (no DB change).
- `server/donations.ts` (leaderboard/stats), admin APIs, `features/admin/*`.
- `lib/sizing.ts` (reused, not edited).

## 3. DB migration plan
**None.** Zones are static in `lib/placement.ts`. Allocation filters via
`anchorKey = ANY(<eligible keys>)` against the existing `Position` table.

## 4. Backend changes

### 4a. `lib/placement.ts` (pure, client-safe — no env, no prisma)
```ts
export type Zone = "PREMIUM" | "STANDARD" | "ECONOMY";

export const ZONE_BY_ANCHOR: Record<string, Zone> = {
  hood: "PREMIUM", roof: "PREMIUM", "front-door-left": "PREMIUM", "front-fender-right": "PREMIUM",
  "front-bumper": "STANDARD", "side-mirror-left": "STANDARD", "rear-door-left": "STANDARD", "roof-edge": "STANDARD",
  trunk: "ECONOMY", spoiler: "ECONOMY", "rear-fender-right": "ECONOMY", "side-skirt-right": "ECONOMY",
};

export const ZONE_LABEL: Record<Zone, string> = {
  PREMIUM: "Bonnet & roof", STANDARD: "Side panel", ECONOMY: "Rear, by the wheel",
};

// Best → worst across the whole car.
export const PROMINENCE: string[] = [
  "hood","front-fender-right","front-door-left","roof",
  "side-mirror-left","front-bumper","rear-door-left","roof-edge",
  "trunk","rear-fender-right","spoiler","side-skirt-right",
];

// Eligible zones per size, best zone first.
export const ELIGIBLE_ZONES: Record<NameSize, Zone[]> = {
  XS: ["ECONOMY"], S: ["ECONOMY"],
  M: ["STANDARD","ECONOMY"], L: ["STANDARD","ECONOMY"],
  XL: ["PREMIUM","STANDARD","ECONOMY"], XXL: ["PREMIUM","STANDARD","ECONOMY"],
};

// Anchor keys a size may occupy, ordered best-available first.
export function eligibleAnchorKeys(size: NameSize): string[] {
  const zones = new Set(ELIGIBLE_ZONES[size]);
  return PROMINENCE.filter((k) => zones.has(ZONE_BY_ANCHOR[k]));
}

// For the upgrade nudge: zones a *higher* amount would unlock.
export function upgradeHint(size: NameSize): string { /* compose from ELIGIBLE_ZONES + thresholds */ }
```
Min amount per zone (for the nudge text) derived from `lib/sizing.ts` tiers:
Economy ≥ ₹50, Standard ≥ ₹200, Premium ≥ ₹1000.

### 4b. `server/placement.ts`
- `pickCandidate(carId, size)` → `{ anchorKey, label, coordinates, rotation, scale, zone, zoneLabel } | null`
  using a non-locking `findFirst` over free anchors in `eligibleAnchorKeys(size)`,
  ordered by prominence. Used by the preview route.

### 4c. `server/positions.ts` — zone-aware reservation
Change signature to `reserveFreePosition(carId: string, size: NameSize)`. SQL:
```sql
SELECT id, "anchorKey" FROM "Position"
WHERE "carId" = $car
  AND occupied = false
  AND ("reservedUntil" IS NULL OR "reservedUntil" < now())
  AND "anchorKey" = ANY($eligibleKeys)
ORDER BY array_position($orderedKeys::text[], "anchorKey")
LIMIT 1
FOR UPDATE SKIP LOCKED
```
Pass `eligibleAnchorKeys(size)` as both the ANY filter and the order array (Prisma
`$queryRaw` with `Prisma.sql`/array params). Returns `null` when no eligible free spot.

### 4d. `create-order` route
- After `amountToSize(amount)`, call `reserveFreePosition(car.id, size)`.
- On `null`: if any **higher** tier still has free eligible spots, return `409` with
  `upgradeHint(size)`; else return the existing "all spots taken" copy.
- Rest of the flow (Razorpay order, pending store) unchanged.

### 4e. `app/api/placement/preview/route.ts`
- Parse + clamp `amountPaise` (int, ≥ 0). Rate-limit `preview:<ip>` 30/60s.
- `getActiveCar()` → `pickCandidate(car.id, amountToSize(amount))`.
- Return `PreviewPlacement` (size, zone, zoneLabel, blocked, anchor|null, upgradeHint?).
- `export const dynamic = "force-dynamic"`.

## 5. Frontend changes

### 5a. `store/useDonationModal.ts`
Add `draft: { name: string; amountPaise: number } | null`, `setDraft(partial)`,
clear on `close()`. Keep `isOpen/open/close`.

### 5b. `features/donate/DonationModal.tsx` → drawer
- Container: right-side drawer on `lg` (`fixed right-0 inset-y-0 w-[420px]`), bottom
  sheet on mobile (`inset-x-0 bottom-0 max-h-[85vh]`). Backdrop only over the
  non-viewer area (or a lighter scrim) so the car stays visible. Same form fields.
- On name/amount change, `setDraft({ name, amountPaise })` (RHF `watch` + effect).
- Show `zoneLabel` + size + `upgradeHint` (from a `useQuery` on the preview endpoint,
  shared key with the viewer) under the amount field.

### 5c. `features/viewer/PreviewName.tsx` (new)
- Props: `anchor` (coordinates/rotation/scale) + `name`. Renders a translucent
  `NameText`-style `<Text>` (e.g. opacity ~0.6, accent outline) plus a subtle pulsing
  highlight (a thin ring or animated emissive marker) at the anchor. Pulse via
  `useFrame`.

### 5d. `features/viewer/CarViewer.tsx`
- Read `draft` from store; `useQuery(["placement-preview", amountPaise])` (enabled when
  drawer open + amount ≥ min), `keepPreviousData`. Render `<PreviewName>` inside the
  existing `<Canvas>` when a candidate exists. Reuse the single Canvas — no new context.

### 5e. `types/index.ts`
```ts
export type Zone = "PREMIUM" | "STANDARD" | "ECONOMY";
export interface PreviewPlacement {
  size: NameSize; zone: Zone | null; zoneLabel: string | null;
  blocked: boolean; upgradeHint?: string;
  anchor: { anchorKey: string; label: string; coordinates: Vec3; rotation: Vec3; scale: number } | null;
}
```

## 6. Conventions to follow (from CODEBASE.md §6 / ARCHITECTURE.md)
- `@/*` import alias; feature code under `features/<area>/`, shared logic under `lib/`,
  server-only data access under `server/` with `import "server-only"`.
- Route handlers: `export const dynamic = "force-dynamic"` on live routes; validate input;
  return `Response.json`. Client-safe modules must not import the generated Prisma client.
- Zustand store in `store/`. TanStack Query for client data; invalidate `["cars"]` etc.
- Tailwind v4 utilities with `dark:` variants. Default-exported PascalCase components.
- Strict TS — no `any`.

## 7. Task breakdown
Data/logic (`lib/placement.ts`, types) → Backend (server helpers, allocation, routes) →
Frontend (store, drawer, preview render) → Tests. See FEATURE_TASKS.md.

## 8. Rollback plan
- Revert `reserveFreePosition` to the alphabetical `ORDER BY "anchorKey"` and drop the
  `size` arg; revert the create-order call site.
- Delete `lib/placement.ts`, `server/placement.ts`, the preview route, `PreviewName.tsx`.
- Revert the store + DonationModal + CarViewer diffs.
- No DB migration to undo. Existing names/positions unaffected.

## 9. Testing strategy
- `tests/placement.test.ts`: `eligibleAnchorKeys` per size; ordering; `ZONE_BY_ANCHOR`
  covers all 12 anchors exactly once; `upgradeHint` text per tier; small-tier-only-Economy
  and large-tier-fallthrough invariants.
- Keep `tests/sizing.test.ts` green (unchanged).
- Manual: simulate-pay across ₹50 / ₹500 / ₹2500 and confirm spot zone; fill Economy and
  confirm a ₹50 is blocked with nudge while ₹2500 still places.

## 10. CODEBASE.md sections to update
- §2/§6 (patterns): note `lib/placement.ts` as the placement source of truth.
- §9 (file map): add new files + the `reserveFreePosition` signature change.
- Routes: add `GET /api/placement/preview`.
