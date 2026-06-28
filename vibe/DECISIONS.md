# DECISIONS — 3d-bmw
> Append-only. Every drift, scope change, tech choice — logged with full context.
> Onboarded via vibe-init on 2026-06-28. All decisions prior to this date are untracked.

## Decision types
- drift — deviated from ARCHITECTURE.md
- blocker-resolution — impossible; workaround found
- tech-choice — chose between valid approaches
- scope-change — added/removed via change: command
- discovery — unexpected finding affecting future tasks

## Format
### D-[ID] — [Short title]
- **Date**: · **Task**: [TASK-ID] · **Type**: [type]
- **What was planned**: · **What was done**: · **Why**:
- **Alternatives considered**: · **Impact on other tasks**:
- **Approved by**: human | agent-autonomous

---

### D-001 — Project onboarded via vibe-init
- **Date**: 2026-06-28 · **Task**: vibe-init · **Type**: discovery
- **What was planned**: N/A — legacy project, no prior vibe context
- **What was done**: Generated vibe/ scaffold from codebase analysis.
  Stack: Next.js 16.2.9 (App Router) + React 19.2.4 + TypeScript 5 + Tailwind CSS v4.
  Pattern: App Router, flat `app/` directory — fresh `create-next-app` scaffold.
  Files read: 12 source files across 3 directories (root, `app/`, `public/`).
- **Why**: Retrofitting vibe-* skills framework onto existing codebase.
- **Alternatives considered**: Manual documentation (rejected — too slow and error-prone)
- **Impact on other tasks**: All vibe-* skills now operational.
  SPEC.md is provisional — verify before first vibe-review run.
- **Approved by**: human (triggered vibe-init)

---

### D-003 — Build foundation: stack realities locked
- **Date**: 2026-06-28 · **Task**: build (Phase 1) · **Type**: tech-choice
- **What was done**: Scaffolded the app foundation. Key non-obvious decisions:
  - **Custom non-branded car**, not BMW — resolves trademark exposure (per BRIEF).
  - **Prisma 7** drops `url` from the schema datasource and requires a **driver
    adapter** at runtime → using `@prisma/adapter-pg` (`new PrismaPg({ connectionString })`).
    Generated client lives at `app/generated/prisma` (gitignored), imported via
    `@/app/generated/prisma/client`. Seed configured in `prisma.config.ts`.
  - **Docker Postgres mapped to host port 5434** (5432 and 5433 already taken on
    this machine). `DATABASE_URL` uses 5434. Redis on 6379.
  - **Next 16**: route handler `params` are async Promises; `force-dynamic` on
    live routes; client providers via `app/providers.tsx` (TanStack Query).
  - **GLB rendering** via drei `useGLTF` from `public/models/car.glb`, with a
    primitive `PlaceholderCar` fallback (ModelErrorBoundary) so it runs without the asset.
- **Why**: Match the locked stack from BRIEF/business.md while keeping the app
  bootable before secrets (Razorpay) and the real GLB are supplied.
- **Impact**: Build + typecheck pass; `/api/cars` serves seeded car #1 (12 anchors).
- **Approved by**: human (triggered build)

---

### D-002 — Discovery: scaffold-only state vs. "3d-bmw" project name
- **Date**: 2026-06-28 · **Task**: vibe-init · **Type**: discovery
- **What was planned**: N/A
- **What was done**: Noted that the project is named `3d-bmw` and appears intended as a
  3D BMW visualization/configurator, but no 3D library (three.js, react-three-fiber, etc.),
  model assets, or related code exist. The codebase is the unmodified create-next-app default.
- **Why**: Flagging so the next agent does not assume 3D infrastructure exists.
- **Alternatives considered**: N/A
- **Impact on other tasks**: First real `feature:` likely needs a 3D rendering stack decision
  (tech-choice) before any 3D work begins. Confirm product scope with team.
- **Approved by**: agent-autonomous

---

### D-003 — Tuned anchor coordinates to the real GLB (names were floating)
- **Date**: 2026-06-28 · **Task**: bug-fix · **Type**: drift
- **What was planned**: `lib/anchors.ts` shipped placeholder model-space coordinates,
  to be tuned once the real GLB loaded.
- **What was done**: Measured the normalized model from `features/viewer/GLBCar.tsx`
  (length z=4.4, width x≈2.03 incl. mirrors → body surface ≈ ±0.88, height y≈1.38).
  Retuned all 12 `DEFAULT_ANCHORS`: side anchors moved from x=±1.1 (outside the body,
  so names hovered in mid-air) to ±0.82–0.86 on the panels; z values pulled within the
  ±2.2 bumper span; heights set to real panel levels.
- **Why**: Donor names rendered floating off the car surface (reported with screenshot).
- **Impact**: Made `prisma/seed.ts` idempotent — it now upserts each `Position` and
  re-syncs `coordinates`/`rotation` on existing rows (preserving any attached donation),
  so retuning anchors no longer requires a DB reset. Re-ran `npm run db:seed`; `/api/cars`
  now serves the corrected coordinates for car #1.
- **Approved by**: human (reported bug)

---

## — Feature Start: Amount-tiered placement + live spot preview — 2026-06-28
> Folder: vibe/features/2026-06-28-amount-tiered-placement/
> Contribution amount decides placement zone (cheap → rear/low by the wheel, premium →
> bonnet/doors/roof) + live 3D preview of the spot & size before paying.
> Tasks: T1–T7 | Estimated: ~12–15 hours
> Unplanned addition (no PLAN.md existed). Drift logged below.

### D-004 — Tech-choice: zones as static map, no DB migration
- **Date**: 2026-06-28 · **Task**: feature-planning (T1/T2) · **Type**: tech-choice
- **What was planned**: Tier placement by amount.
- **What was done**: Defined 3 prominence zones (Premium/Standard/Economy) over the
  fixed 12 anchors as a static `ZONE_BY_ANCHOR` map in `lib/placement.ts`, rather than
  adding a `zone` column to `Position`. Allocation filters via `anchorKey = ANY(...)`.
- **Why**: Anchors are a fixed set; a static map keeps the change additive, migration-free,
  and reversible while still allowing future move to a DB column if admin-editable zones
  are needed.
- **Alternatives considered**: `zone` enum column on Position (deferred to when zones
  must be editable per-car without redeploy).
- **Impact**: No schema change; `reserveFreePosition` gains a `size` arg.

### D-005 — Product decisions (user-confirmed) for v1
- **Date**: 2026-06-28 · **Task**: feature-planning · **Type**: scope-change
- **Decisions** (via AskUserQuestion):
  - Spot assignment: **auto-assign best available** in the paid tier (spot-picker deferred).
  - Economy full for a small tier: **block with an upgrade nudge** (preserve premium
    scarcity), not auto-upgrade into a higher zone.
  - Preview: **highlight the candidate spot on the main car** (not a mini 3D in the modal)
    → donation form moves to a side drawer/sheet so the viewer stays visible.
- **Impact**: DonationModal (shared component) becomes a drawer — flagged "ask first";
  changes are additive to fields/submit. Future: spot picker, per-zone price floors,
  camera fly-to, multi-car overflow.

### Feature complete — Amount-tiered placement + live spot preview — 2026-06-28
- **Status**: shipped (T1–T7). 27/27 tests pass, tsc + lint clean, verified in browser.
- **Delivered**: `lib/placement.ts`, `server/placement.ts`, `app/api/placement/preview`,
  `features/donate/usePlacementPreview.ts`, `features/viewer/PreviewName.tsx`,
  `tests/placement.test.ts` (new); zone-aware `reserveFreePosition(carId,size)` +
  `hasFreePositions`, create-order upgrade nudge, draft store, DonationModal drawer,
  CarViewer preview wiring (modified). No DB migration.
- **Follow-ups (deferred)**: spot picker for high tiers; per-zone price floors in admin
  Settings; camera fly-to candidate; multi-car overflow; consider toning XXL scale or
  nudging the side-mirror anchor (XXL ghost rides onto the windshield).
