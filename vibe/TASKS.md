# TASKS — 3d-bmw
> Onboarded via vibe-init on 2026-06-28.
> This project was not built using the vibe-* framework.
> TASKS.md starts here. All future work tracked from this point forward.

## What we're working with
A fresh Next.js 16.2.9 (App Router) + React 19.2.4 + TypeScript 5 + Tailwind v4
scaffold. Only the default `create-next-app` landing page exists (~12 source files).
The name `3d-bmw` suggests an intended 3D BMW visualization, but no 3D code or assets
are present yet — the real product is unbuilt.

## Active work
**Building "Name on the Car" donation app** (BRIEF.md). Phases 1–3 done & tested.

### What just happened (2026-06-28)
- **Shipped: Amount-tiered placement + live spot preview (T1–T7 complete).** Amount →
  size → eligible zone → best-available spot, with fair fallthrough + upsell nudge; live
  blue ghost-name preview in the viewer driven by the measured anchors. 27/27 tests pass.
- **Fixed names floating off the car.** The placeholder anchors in `lib/anchors.ts`
  placed side names at x=±1.1 — outside the real body (≈±0.88), so they hovered in
  mid-air. Measured the normalized GLB and retuned all 12 anchors onto the panels.
  Made `prisma/seed.ts` idempotent (upserts positions, re-syncs coords without a reset)
  and re-seeded. See DECISIONS D-003.

### Recently completed
✅ **Amount-tiered placement + live spot preview** (7/7) — the amount you pay now decides
   *where* your name goes (₹50–199 → rear/low by the wheel · ₹200–999 → side panels ·
   ₹1000+ → bonnet/doors/roof), and you see a live blue preview of the exact spot & size
   on the car before paying. Small tiers get an upsell nudge when their zone is full.
   Backend (zones, allocation, preview API) + UI (drawer, live ghost) done & verified;
   27/27 tests pass. Optional `review:` pass before release.
   → Specs: vibe/features/2026-06-28-amount-tiered-placement/FEATURE_TASKS.md

### What's next (Phase 4 — assets + production)
- [x] Real GLB present (`2021_bmw_218i_gran_coupe_1.5.glb`); anchor coordinates tuned to it (D-003)
- [ ] Add real Razorpay keys to `.env`; configure webhook URL (needs public URL/tunnel)
- [ ] Overflow: auto-create next car when one fills (currently returns 409 "full") — v2
- [ ] HDR environment/PBR polish on the viewer; glow on newly-added names
- [ ] Reservation sweeper (expire stale holds) — currently expiry is lazy via reservedUntil
- [ ] Admin extras (per spec, v2): approval-required mode, profanity-list editor, position editor, analytics
- [ ] Deploy (Vercel + managed Postgres + Upstash Redis); set funds-disclosure copy

## Completed
- **Phase 3 — Admin panel, tested (2026-06-28):** `/admin` dashboard (stats +
  donation table) gated by `AUTH_ENABLED`; HMAC-signed session cookie login/logout
  (`lib/admin-auth.ts`); admin APIs (list w/ search+filter, PATCH moderation,
  DELETE w/ spot-free, CSV export) all 401-protected; hide/approve/reject/delete
  + Export CSV in the UI. **Tested:** open-mode moderation (hide removes from
  public car, approve restores, delete frees the anchor), CSV export, and the
  AUTH_ENABLED=true path (401 unauth, 307 redirect, bad creds 401, login→200→authed).
- **Phase 2 — Donation flow, front+back, tested (2026-06-28):** donation modal
  (RHF+Zod, tier preview, quick amounts); `POST /api/donations/create-order`
  (rate-limit → validate → moderate → reserve position `FOR UPDATE SKIP LOCKED`
  → Razorpay order / dev-sim); `POST /api/razorpay/webhook` (signature-verified,
  source of truth); `POST /api/dev/confirm` (dev-only payment simulation);
  `GET /api/stream` (SSE live broadcast); `GET /api/leaderboard`; profanity +
  sanitization; size tiers; Leaderboard + live viewer refresh.
  **Tested:** 14 unit tests pass; build + typecheck pass; integration test of full
  donate→name-on-car flow (sim), moderation/min-amount guards, SSE broadcast,
  and concurrency race-safety (distinct anchors, no double-allocation).
- **Phase 1 — Foundation (2026-06-28):** deps (R3F/drei/three, Prisma 7 + pg
  adapter, ioredis, zustand, react-query, RHF, zod, razorpay); Docker Postgres
  (host :5434) + Redis; Prisma schema (Car/Position/Donation/Payment/AuditLog/
  Settings/User) + migration + seed (car #1, 12 anchors); env validation;
  `/api/cars`; TanStack Query provider; 3D `CarViewer` with GLB loader + placeholder
  fallback + live names; homepage with stats + funds disclosure.

(prior work not tracked — project onboarded on 2026-06-28)

## Phase gates
(not applicable — project pre-dates vibe-* framework)

## What's next
1. Confirm the product scope (is this a 3D BMW configurator?) — see DECISIONS D-002.
2. Run `review:` on the current codebase to establish a quality baseline.
3. Then use `feature:` or `bug:` to start tracking work normally.
