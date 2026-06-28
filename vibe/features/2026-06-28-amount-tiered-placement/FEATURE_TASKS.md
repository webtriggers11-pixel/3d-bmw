# FEATURE_TASKS — Amount-tiered placement + live spot preview

> Spec: ./FEATURE_SPEC.md · Plan: ./FEATURE_PLAN.md
> **Estimated effort:** 7 tasks — S: 3, M: 3, L: 1 — approx. 12–15 hours total.
> Order matters: T1 → T2 → T3 → (T4, T5) → T6 → T7. Manual mode: say "next" between tasks.

---
### T1 · Placement zone logic + types
- **Status**: `[x]` ✅ done 2026-06-28 — verified: all 12 anchors zoned once, eligibility/ordering correct, tsc + lint clean, 14 tests pass.
- **Size**: M
- **Spec ref**: FEATURE_SPEC.md#6-zone-model-the-core-business-logic
- **Dependencies**: None
- **Touches**: `lib/placement.ts` (new), `types/index.ts`

**What to do**: Create `lib/placement.ts` (pure, client-safe — no env/prisma imports):
`Zone` type, `ZONE_BY_ANCHOR`, `ZONE_LABEL`, `PROMINENCE`, `ELIGIBLE_ZONES`,
`eligibleAnchorKeys(size)`, and `upgradeHint(size)`. Thresholds: Economy ≥ ₹50,
Standard ≥ ₹200, Premium ≥ ₹1000 (mirror `lib/sizing.ts` tiers). Add `Zone` and
`PreviewPlacement` to `types/index.ts`.

**Acceptance criteria**:
- [ ] Every one of the 12 anchorKeys in `lib/anchors.ts` appears in `ZONE_BY_ANCHOR` exactly once.
- [ ] `eligibleAnchorKeys` returns Economy-only for XS/S, Standard+Economy for M/L, all for XL/XXL, each in prominence order.
- [ ] `upgradeHint` names the next zones a higher amount unlocks.

**Self-verify**: Re-read FEATURE_SPEC.md#6. Tick every criterion.
**Test requirement**: Covered by T7; logic must be import-safe from both client and server.
**⚠️ Boundaries**: Do not import the generated Prisma client here (client-safe module).
**CODEBASE.md update?**: Yes — note `lib/placement.ts` as placement source of truth.
**Architecture compliance**: `lib/` for shared pure logic; strict TS, no `any`.

**Decisions**:
- None yet.

---
### T2 · Zone-aware reservation
- **Status**: `[x]` ✅ done 2026-06-28 — `reserveFreePosition(carId,size)` filters to eligible zones, orders by prominence (CASE), keeps FOR UPDATE SKIP LOCKED. `server/placement.ts#pickCandidate` (read-only) added. Verified vs DB: raw SQL == pickCandidate across all 6 sizes; tsc + lint clean.
- **Size**: M
- **Spec ref**: FEATURE_SPEC.md#6 · FEATURE_PLAN.md#4c
- **Dependencies**: T1
- **Touches**: `server/positions.ts`, `server/placement.ts` (new)

**What to do**: Change `reserveFreePosition(carId, size)` to filter free anchors by
`eligibleAnchorKeys(size)` and order by prominence (`array_position`), keeping
`FOR UPDATE SKIP LOCKED`. Add `server/placement.ts` with non-locking
`pickCandidate(carId, size)` for the preview route.

**Acceptance criteria**:
- [ ] Reservation only ever returns an anchor in an eligible zone for the size.
- [ ] Best-available ordering follows the prominence ranking.
- [ ] Returns `null` when no eligible free spot exists.
- [ ] Concurrency unchanged (still `FOR UPDATE SKIP LOCKED`).

**Self-verify**: Re-read FEATURE_PLAN.md#4c. Confirm SQL params are parameterized.
**Test requirement**: Allocation invariants covered in T7 (pure-logic level); manual sim-pay for SQL.
**⚠️ Boundaries**: Do NOT touch `finalizePaidDonation`. Keep `server-only`.
**CODEBASE.md update?**: Yes — record the `reserveFreePosition` signature change.
**Architecture compliance**: `server/` data access, `import "server-only"`.

**Decisions**:
- None yet.

---
### T3 · Tiered allocation + upgrade nudge in create-order
- **Status**: `[x]` ✅ done 2026-06-28 — null reservation → upgrade nudge (`upgradeHint`) when higher zones have room (`hasFreePositions`), else generic full. Verified reversibly vs DB: Economy-full ₹50 → 409 nudge, ₹1000 still got roof; DB reverted clean. tsc + lint + 14 tests pass.
- **Size**: S
- **Spec ref**: FEATURE_SPEC.md#9 · FEATURE_PLAN.md#4d
- **Dependencies**: T2
- **Touches**: `app/api/donations/create-order/route.ts`

**What to do**: Pass `size` into `reserveFreePosition`. On `null`, return `409` with
`upgradeHint(size)` if a higher tier still has free spots, else the existing
"all spots taken" message.

**Acceptance criteria**:
- [ ] ₹50–199 with Economy full → 409 + upgrade nudge.
- [ ] Large tier falls through to lower zones; only 409 when the car is fully taken.
- [ ] Successful path (order + pending store) is otherwise unchanged.

**Self-verify**: Re-read FEATURE_SPEC.md#9. Confirm no behavior change on the happy path.
**Test requirement**: Manual: sim-pay ₹50 / ₹500 / ₹2500; fill Economy then retry ₹50.
**⚠️ Boundaries**: Don't change response shape beyond the error message/field.
**CODEBASE.md update?**: No — logic only.
**Architecture compliance**: validate input; `force-dynamic`; `Response.json`.

**Decisions**:
- None yet.

---
### T4 · Preview endpoint
- **Status**: `[x]` ✅ done 2026-06-28 — `GET /api/placement/preview` returns candidate (zone/anchor/scale) or blocked+upgradeHint, mirrors create-order. force-dynamic, rate-limited 30/60. Verified live: ₹50→Economy/spoiler, ₹500→Standard/side-mirror, ₹2500→fell through to Standard (premium full), invalid→400.
- **Size**: S
- **Spec ref**: FEATURE_SPEC.md#7
- **Dependencies**: T2
- **Touches**: `app/api/placement/preview/route.ts` (new)

**What to do**: `GET /api/placement/preview?amountPaise=<int>` → `PreviewPlacement`
via `pickCandidate`. `force-dynamic`, rate-limit `preview:<ip>` 30/60s, read-only.

**Acceptance criteria**:
- [ ] Returns size, zone, zoneLabel, anchor (coords/rotation/scale) or `blocked`+`upgradeHint`.
- [ ] Reserves nothing; no writes.
- [ ] Rate-limited; handles no-active-car gracefully.

**Self-verify**: Re-read FEATURE_SPEC.md#7. Curl across several amounts.
**Test requirement**: Manual curl; logic via T7.
**⚠️ Boundaries**: Read-only — never reserve or mutate.
**CODEBASE.md update?**: Yes — add the route to the routes list.
**Architecture compliance**: route handler conventions; rate-limit reuse.

**Decisions**:
- None yet.

---
### T5 · Live draft store + donation drawer
- **Status**: `[x]` ✅ done 2026-06-28 — store gains `draft`/`setDraft` (cleared on close); `usePlacementPreview` hook (shared with viewer); DonationModal → right drawer / bottom sheet with debounced draft + live zone label / upgrade nudge. Verified in browser: car stays visible, label updates ₹100→spoiler/Economy, ₹2500→side-mirror/Standard. tsc clean.
- **Size**: M
- **Spec ref**: FEATURE_SPEC.md#5,#8 · FEATURE_PLAN.md#5a,#5b
- **Dependencies**: T1
- **Touches**: `store/useDonationModal.ts`, `features/donate/DonationModal.tsx`

**What to do**: Add `draft` + `setDraft` to the store (cleared on close). Reposition the
form as a right drawer (`lg`) / bottom sheet (mobile) so the car stays visible. Write
`{ name, amountPaise }` to the store on field change (debounced ~250ms). Show
zoneLabel + size + upgradeHint under the amount field via a shared preview query.

**Acceptance criteria**:
- [ ] Car viewer remains visible while the form is open (drawer/sheet).
- [ ] Draft updates as the user types name / changes amount.
- [ ] Zone label + size shown; upgrade nudge shown when blocked.
- [ ] Existing submit/pay flow unchanged.

**Self-verify**: Re-read FEATURE_SPEC.md#5,#8. Check mobile sheet + dark mode.
**Test requirement**: Manual: open form, type, watch label update.
**⚠️ Boundaries**: Changing a shared component (DonationModal) — keep all existing
fields/validation/submit behavior intact; additive only.
**CODEBASE.md update?**: Yes — note the store shape + drawer pattern.
**Architecture compliance**: zustand in `store/`; Tailwind v4 + `dark:`; client component.

**Decisions**:
- None yet.

---
### T6 · Live preview render + spot highlight
- **Status**: `[x]` ✅ done 2026-06-28 — `PreviewName` (accent ghost, pulsing material opacity) at the candidate anchor; CarViewer reads draft+preview, renders inside the single Canvas, gated on drawer-open. Verified in browser: blue "ASHA" appears on side-mirror at ₹2500/XXL, matches label, clears on close. tsc + lint clean.
- **Size**: L
- **Spec ref**: FEATURE_SPEC.md#5,#6,#10 · FEATURE_PLAN.md#5c,#5d
- **Dependencies**: T4, T5
- **Touches**: `features/viewer/PreviewName.tsx` (new), `features/viewer/CarViewer.tsx`

**What to do**: Add `PreviewName` (translucent name + pulsing highlight via `useFrame`)
at the candidate anchor. In `CarViewer`, read the draft, `useQuery` the preview endpoint
(enabled when drawer open + amount ≥ min, `keepPreviousData`), render `<PreviewName>`
inside the existing Canvas. Match committed-name geometry exactly.

**Acceptance criteria**:
- [ ] Candidate spot highlighted; typed name (or placeholder) rendered there at tier size.
- [ ] Updates live (debounced) on name/amount change.
- [ ] Position/rotation/scale identical to how the committed name will render.
- [ ] Preview disappears on close/submit; reuses the single Canvas (no 2nd WebGL context).
- [ ] Viewer stays ≳30fps.

**Self-verify**: Re-read FEATURE_SPEC.md#5,#6. Compare preview vs post-pay placement.
**Test requirement**: Manual: vary amount, confirm spot jumps zones at ₹200 / ₹1000.
**⚠️ Boundaries**: Don't alter how existing `NameText` renders committed names.
**CODEBASE.md update?**: Yes — add `PreviewName.tsx`.
**Architecture compliance**: drei/`@react-three/fiber` patterns; client component.

**Decisions**:
- None yet.

---
### T7 · Tests
- **Status**: `[x]` ✅ done 2026-06-28 — `tests/placement.test.ts` (13 tests): zone coverage, eligibility per size + ordering, small-tier-only-Economy / large-tier-fallthrough, no-premium-for-small, upgradeHint text. Suite: 27/27 pass; lint + tsc clean.
- **Size**: S
- **Spec ref**: FEATURE_SPEC.md#11 · FEATURE_PLAN.md#9
- **Dependencies**: T1 (logic), ideally after T2–T6
- **Touches**: `tests/placement.test.ts` (new)

**What to do**: Unit-test `lib/placement.ts`: all 12 anchors zoned once; `eligibleAnchorKeys`
per size + ordering; small-tier-only-Economy and large-tier-fallthrough invariants;
`upgradeHint` text per tier. Mirror the `tests/sizing.test.ts` style.

**Acceptance criteria**:
- [ ] New tests pass (`npm test`).
- [ ] All existing tests still pass.

**Self-verify**: Re-read FEATURE_SPEC.md#11. Tick conformance items the tests cover.
**Test requirement**: This task is the tests.
**⚠️ Boundaries**: Don't modify existing passing tests.
**CODEBASE.md update?**: No.
**Architecture compliance**: vitest; pure-logic tests, no DB.

**Decisions**:
- None yet.

---
#### Conformance: Amount-tiered placement + live spot preview
> All items ✅ — feature shippable (pending an optional `review:` pass).
- [x] Zones defined for all 12 anchors; each in exactly one zone.
- [x] `amountToSize` → eligible-zone mapping matches FEATURE_SPEC.md#6.
- [x] Allocation only ever returns an anchor in an eligible zone for the paid size.
- [x] Best-available ordering follows the prominence ranking.
- [x] Small-tier full → 409 with upgrade nudge; large-tier falls through. (verified reversibly vs DB)
- [x] Preview endpoint returns candidate without reserving; rate-limited; force-dynamic.
- [x] Live preview matches final coordinates/rotation/scale exactly. (same SIZE_SCALE × pos.scale + coords/rotation)
- [x] Preview updates live (debounced 250ms) on name/amount change.
- [x] Form repositioned so the car preview stays visible; mobile bottom sheet.
- [x] No regression: donate→pay path, moderation, admin, leaderboard untouched; 27/27 tests pass.
- [x] New tests pass; existing tests pass; linter clean.
- [x] CODEBASE.md updated for new files/route/signature change.
