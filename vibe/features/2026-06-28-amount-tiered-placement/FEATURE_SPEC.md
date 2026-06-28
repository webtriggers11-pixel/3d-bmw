# FEATURE_SPEC — Amount-tiered placement + live spot preview

> Folder: vibe/features/2026-06-28-amount-tiered-placement/
> Status: DRAFT · Date: 2026-06-28 · Mode: manual
> Unplanned addition (no PLAN.md existed). Extends the live "Name on the Car" donation app.

---

## 1. Feature overview

Today a donor's contribution sets only the **font size** (`lib/sizing.ts`), and the
spot is assigned by grabbing the alphabetically-first free anchor — placement is
unrelated to how much was paid. This feature makes **placement value-tiered**: small
contributions land on low-visibility rear/low spots (near the wheel), larger
contributions unlock the prominent front/top surfaces (bonnet, doors, roof). Before
paying, the donor sees a **live preview** on the main 3D car — the candidate spot
glows and their name appears there at the size their amount buys — so the value
exchange is obvious at the moment of decision.

This is a prominence-priced sponsorship model (the pattern behind stadium-seat naming
and brick-paver fundraisers): scarce, high-visibility real estate costs more.

## 2. User stories

- **As a small contributor (₹50–199)**, I see that my name will sit on a modest rear
  spot near the wheel at a small size, so my expectation is set before I pay.
- **As a larger contributor (₹1000+)**, I see my name will land on the bonnet/roof at
  a large size, so I understand what the higher amount buys.
- **As any donor**, as I change the amount in the form, the car live-previews exactly
  where my name goes and how big — I decide with full information.
- **As the project owner**, premium surfaces stay scarce and meaningful, which nudges
  contributions upward and is fair to people who paid more.

## 3. Acceptance criteria

1. The 12 anchors are grouped into three **zones** by prominence: **Premium**,
   **Standard**, **Economy** (see §6).
2. A contribution's **size tier** maps to the **zones it may occupy** (§6 table).
   Small tiers are restricted to Economy; larger tiers may use their zone and any
   lower zone (best-available, never rejected for being "too big").
3. On payment, the allocated spot is always within an **eligible zone** for the amount
   paid. A ₹50 name can never be placed on a Premium spot.
4. When **every eligible spot for a small tier is full**, the order is **blocked with
   an upgrade nudge** telling the donor which higher amount unlocks zones that still
   have free spots. Larger tiers that can fall through to lower zones are only blocked
   when the whole car is full.
5. While the donation form is open and a valid amount is entered, the **main car
   viewer shows a live preview**: the candidate spot is highlighted (glow/pulse) and
   the donor's typed name (or a placeholder) is rendered there at the tier's size and
   the correct surface orientation.
6. The preview updates **live** as the name or amount changes (debounced), and the
   preview size/orientation/position **matches the final rendered name exactly** (same
   coordinates, rotation, and scale formula as committed names).
7. The preview is **non-committal**: it does not reserve a spot, and the form copy
   makes clear the exact spot may differ slightly if someone else takes it first; the
   **zone** shown is always honored.
8. The donation form no longer fully obscures the car — it is presented so the live
   preview on the viewer remains visible (side drawer / sheet).
9. All existing donation, moderation, payment, and admin behavior is unchanged.

## 4. Scope boundaries

**Included**
- Zone definitions + size→zone eligibility mapping (`lib/placement.ts`).
- Zone-aware allocation in `reserveFreePosition` (replaces alphabetical pick).
- Preview endpoint `GET /api/placement/preview`.
- Live preview rendering + spot highlight in `CarViewer`.
- Donation form repositioned to a drawer/sheet so the car stays visible.
- Upgrade-nudge messaging on a blocked small-tier order.

**Explicitly deferred (future, as user base grows)**
- Letting donors **pick** a specific spot within their tier (spot picker UI).
- Per-zone price floors editable from the admin Settings panel.
- Camera auto-focus / fly-to the candidate spot.
- Auction / "bump" for taken premium spots.
- Multiple cars + overflow handling (already a separate backlog item).

## 5. Integration points

- `lib/sizing.ts` — existing `amountToSize` + `SIZE_SCALE`; reused as-is.
- `lib/anchors.ts` — the 12 anchorKeys (already tuned to the GLB, DECISIONS D-003).
- `server/positions.ts` — `reserveFreePosition(carId)` → becomes zone-aware.
- `app/api/donations/create-order/route.ts` — passes `size` into allocation; emits the
  upgrade-nudge 409.
- `features/donate/DonationModal.tsx` — becomes a drawer; writes live draft to a store.
- `store/useDonationModal.ts` — extended with the live draft (name + amountPaise).
- `features/viewer/CarViewer.tsx` + `features/viewer/NameText.tsx` — render the ghost
  preview + highlight.
- `types/index.ts` — add `Zone`, `PreviewPlacement`.

No changes to: webhook allocation contract (`finalizePaidDonation` still allocates the
reserved position), Donation/Payment schema, admin APIs, leaderboard.

## 6. Zone model (the core business logic)

Anchors grouped by visibility from the default camera + auto-rotate (front/top = most
seen, rear/low = least seen):

| Zone | Anchors (anchorKey) | Why | Eligible size tiers | ~Amount |
|------|---------------------|-----|---------------------|---------|
| **Premium** | `hood`, `roof`, `front-door-left`, `front-fender-right` | Front + top, always in view | XL, XXL | ₹1000+ |
| **Standard** | `front-bumper`, `side-mirror-left`, `rear-door-left`, `roof-edge` | Mid body / sides | M, L | ₹200–999 |
| **Economy** | `trunk`, `spoiler`, `rear-fender-right`, `side-skirt-right` | Rear + low, near the wheels | XS, S | ₹50–199 |

**Eligibility (best-available, falls downward, never upward):**

| Size | Amount | May occupy (best → fallback) |
|------|--------|------------------------------|
| XS, S | ₹50–199 | Economy |
| M, L | ₹200–999 | Standard → Economy |
| XL, XXL | ₹1000+ | Premium → Standard → Economy |

**Prominence ranking** (used to pick "best available" within the eligible set,
best first):
`hood` → `front-fender-right` → `front-door-left` → `roof` → `side-mirror-left` →
`front-bumper` → `rear-door-left` → `roof-edge` → `trunk` → `rear-fender-right` →
`spoiler` → `side-skirt-right`.

Allocation picks the **first free anchor** in this ranking that is within an eligible
zone for the paid size.

## 7. New API endpoints

### `GET /api/placement/preview?amountPaise=<int>`
Computes the candidate placement for an amount **without reserving** anything.

Response `200`:
```jsonc
{
  "size": "L",                     // from amountToSize
  "zone": "STANDARD",              // best eligible zone with a free spot
  "zoneLabel": "Side panel",       // human label for the zone
  "blocked": false,
  "anchor": {                      // null if blocked
    "anchorKey": "rear-door-left",
    "label": "Rear Door",
    "coordinates": { "x": -0.86, "y": 0.68, "z": -0.55 },
    "rotation": { "x": 0, "y": -1.57, "z": 0 },
    "scale": 1.3                   // SIZE_SCALE[size] * position.scale
  }
}
```
Blocked response `200` (small tier, eligible zones full):
```jsonc
{
  "size": "XS", "zone": null, "zoneLabel": null, "blocked": true,
  "anchor": null,
  "upgradeHint": "All ₹50–199 spots are taken. Contribute ₹200+ for a side panel, or ₹1000+ for the bonnet."
}
```
- `force-dynamic`, never cached. Rate-limited (reuse `rateLimit`, e.g. 30/min/IP).
- Reads the active car's free anchors only; no writes.

## 8. Data model changes

**None.** Zones are a static property of the fixed 12 anchors and live in
`lib/placement.ts` (`ZONE_BY_ANCHOR`). Allocation passes the eligible anchorKeys into
the existing `Position` query (`anchorKey = ANY(...)`), so no migration is required.
This keeps the change additive and reversible.

## 9. Edge cases & error states

- **Eligible zones full (small tier):** `reserveFreePosition` returns `null`; create-order
  returns `409` with the computed upgrade nudge. Preview shows `blocked` + `upgradeHint`.
- **Whole car full:** any tier → `409` "All spots on this car are taken" (existing copy).
- **Amount below minimum:** existing schema validation rejects before placement.
- **Concurrent buyers:** `FOR UPDATE SKIP LOCKED` still guarantees no double-allocation;
  preview is best-effort and may show a spot that gets taken — zone is still honored.
- **Preview endpoint while no active car:** returns `blocked` with a neutral message.
- **Reservation expiry:** unchanged (`reservedUntil` lazy expiry); zone filter also
  treats expired reservations as free.
- **Model/preview offline:** if the GLB or preview query fails, the form still works
  (preview is progressive enhancement; payment path does not depend on it).

## 10. Non-functional requirements

- Preview endpoint p95 < 100ms (single indexed query on the active car).
- Preview render must not drop the viewer below ~30fps; reuse the existing Canvas (no
  second WebGL context).
- Debounce live preview lookups (~250ms) to avoid request spam while typing.
- Mobile: drawer becomes a bottom sheet; preview still visible above it.
- Security: preview endpoint is read-only, rate-limited, and reveals only zone/anchor
  geometry already implied by public names — no PII.

## 11. Conformance checklist

- [ ] Zones defined for all 12 anchors; every anchor belongs to exactly one zone.
- [ ] `amountToSize` → eligible-zone mapping matches §6 exactly.
- [ ] Allocation only ever returns an anchor in an eligible zone for the paid size.
- [ ] Best-available ordering follows the §6 prominence ranking.
- [ ] Small-tier full → 409 with upgrade nudge; large-tier falls through to lower zones.
- [ ] Preview endpoint returns candidate without reserving; rate-limited; force-dynamic.
- [ ] Live preview matches final coordinates/rotation/scale exactly.
- [ ] Preview updates live (debounced) on name/amount change.
- [ ] Form repositioned so the car preview stays visible; mobile sheet works.
- [ ] No regression in donate → pay → webhook → render, moderation, admin, leaderboard.
- [ ] Unit tests for the zone/eligibility/allocation logic pass; existing tests pass.
