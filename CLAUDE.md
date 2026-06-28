@AGENTS.md

# CLAUDE.md — 3d-bmw
> 📥 Onboarded via vibe-init on 2026-06-28.
> This project pre-dates the vibe-* framework. All prior decisions are untracked.
> From this point forward, all decisions are logged in vibe/DECISIONS.md.

> ⚠️ See the imported `AGENTS.md` above: this is **Next.js 16**, which has breaking
> changes vs. older versions. Read the relevant guide in `node_modules/next/dist/docs/`
> before writing any Next.js code — do not rely on older Next.js knowledge.

---

## Project overview

**What it is:** A fresh Next.js 16 scaffold; the name `3d-bmw` suggests an intended
3D BMW visualization, but only the default create-next-app landing page exists today.
**Stack:** Node.js + Next.js 16.2.9 (App Router) + React 19.2.4 + TypeScript 5 + Tailwind CSS v4.
**Codebase scale:** ~12 source files, 1 route (`/`), 0 data models.

---

## Commands

```bash
# Development
npm run dev      # next dev

# Build
npm run build    # next build

# Start (production)
npm run start    # next start

# Test
# Not observed during init — no test runner configured

# Lint
npm run lint     # eslint

# Database migrations
# Not applicable — no database
```

---

## Session startup — read in this order

Every agent session must read these files before writing any code:

1. `CLAUDE.md` (this file) — project context and rules
2. `AGENTS.md` (imported above) — Next.js 16 version warning
3. `vibe/CODEBASE.md` — what exists, where things live
4. `vibe/ARCHITECTURE.md` — patterns to follow, conventions to maintain
5. `vibe/SPEC_INDEX.md` — compressed feature map
6. `vibe/TASKS.md` — current work in progress

**If working on a feature:** also read `vibe/features/[date-slug]/FEATURE_TASKS.md`
**If fixing a bug:** also read `vibe/bugs/[date-slug]/BUG_TASKS.md`

Do not write code before completing this read sequence. Confirm the task before starting.

---

## Code style and conventions

**Files:** lowercase route files — `page.tsx`, `layout.tsx`, `globals.css` (App Router convention)
**Functions:** camelCase
**Components:** PascalCase, default-exported — e.g. `Home`, `RootLayout`
**Imports:** `@/*` alias maps to project root; package + relative imports otherwise
**Styling:** Tailwind v4 utility classes inline, with `dark:` variants + CSS custom properties
**Error handling:** none observed — adopt App Router `error.tsx`/`not-found.tsx` conventions
**TypeScript:** strict mode enabled — avoid `any`

---

## Architecture rules

- Routes, layouts, and global styles live under `app/` following App Router conventions.
- Static assets live in `public/` and are referenced from root (e.g. `/next.svg`).
- This is **Next.js 16** — verify APIs against `node_modules/next/dist/docs/` before use.
- No `components/`, `lib/`, `hooks/`, or `api/` folders exist yet — introduce them deliberately as the app grows.
- No 3D stack exists — choosing one is an open tech-choice (see DECISIONS D-002).

Full detail in `vibe/ARCHITECTURE.md`.

---

## Session completion checklist

After every task — no exceptions:

- [ ] Code works and doesn't break existing functionality
- [ ] Follows naming conventions from ARCHITECTURE.md
- [ ] Error handling consistent with observed pattern
- [ ] `vibe/CODEBASE.md` updated if new file, route, schema, or pattern added
- [ ] `vibe/DECISIONS.md` updated if a decision was made (drift, tech choice, blocker)
- [ ] `vibe/TASKS.md` updated — "What just happened" and "What's next"
- [ ] If working a feature: `vibe/features/[slug]/FEATURE_TASKS.md` task marked done
- [ ] If fixing a bug: `vibe/bugs/[slug]/BUG_TASKS.md` task marked done

**The rule:** if something changed in the codebase, something changed in the docs.
If the docs aren't updated, the task isn't done.

---

## Active feature

[Managed by vibe-add-feature — do not edit manually]
<!-- ACTIVE FEATURE: 2026-06-28-amount-tiered-placement -->

### Active Feature: Amount-tiered placement + live spot preview
> Folder: vibe/features/2026-06-28-amount-tiered-placement/ | Added: 2026-06-28

**Feature summary**: Contribution amount now decides *where* the name lands (cheap →
rear/low by the wheel, premium → bonnet/doors/roof), and the donor sees a live preview
of the spot + size on the main 3D car before paying.

**Files in scope**: `lib/placement.ts`, `server/placement.ts`,
`app/api/placement/preview/route.ts`, `features/viewer/PreviewName.tsx`,
`tests/placement.test.ts` (new); `server/positions.ts`,
`app/api/donations/create-order/route.ts`, `store/useDonationModal.ts`,
`features/donate/DonationModal.tsx`, `features/viewer/CarViewer.tsx`, `types/index.ts` (modified).
**Files out of scope**: `server/positions.ts#finalizePaidDonation`, webhook + dev/confirm
routes, Prisma schema/migrations, `server/donations.ts`, admin APIs/UI, `lib/sizing.ts`.

**Conventions** (vibe/CODEBASE.md §6 + vibe/ARCHITECTURE.md):
- `@/*` alias; pure/shared logic in `lib/` (client-safe — no Prisma client import);
  server data access in `server/` with `import "server-only"`; routes `force-dynamic`,
  validate input, `Response.json`; zustand in `store/`; TanStack Query on the client;
  Tailwind v4 + `dark:`; strict TS, no `any`.
- Placement source of truth: `lib/placement.ts` (zones, eligibility, prominence).

**Scope changes**: If user says "change:" — stop and run vibe-change-spec immediately.

**Boundaries:**
Always: follow ARCHITECTURE.md · run existing tests after every change · keep changes
        additive · update CODEBASE.md for new files/routes/signature changes ·
        update TASKS.md after every task in plain English.
Ask first: modifying existing API response shapes · touching auth · changing shared
        components (DonationModal) · any non-additive DB change (none planned here).
Never: change existing feature behavior · alter the webhook allocation contract ·
        remove/rename DB fields · modify existing passing tests · touch out-of-scope files.

**Between tasks:** "next" → run `npm test 2>&1 | tail -20`, `npm run lint --silent 2>&1
| tail -10`, commit code (`feat(tiered-placement): Tn — …`), commit docs separately,
then state the next task and confirm.

**Session startup:** Read CLAUDE.md · vibe/CODEBASE.md · vibe/ARCHITECTURE.md ·
vibe/SPEC_INDEX.md · vibe/TASKS.md · then FEATURE_TASKS.md. Confirm the task before coding.

---

## Active bug

[Managed by vibe-fix-bug — do not edit manually]
<!-- ACTIVE BUG: none -->

---

## No phase gates

This project was not built with the vibe-* framework.
There are no Phase 1 / Phase 2 / Phase 3 gates.

Use `review:` on demand — after completing a significant feature or before a release.
Use `feature:` and `bug:` to track all future work through normal vibe-* workflow.

---

## What's untracked

All work done before 2026-06-28 is untracked.
`vibe/SPEC.md` is PROVISIONAL — verify before using `review:` as a correctness reference.
`vibe/DECISIONS.md` starts from today — prior decisions are unknown.

When you encounter something in the code that doesn't match ARCHITECTURE.md patterns,
log it as a `discovery` type entry in DECISIONS.md rather than treating it as drift.
It may be intentional — you don't have the history to know.
