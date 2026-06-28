# BRIEF.md
> Created: 2026-06-28 via brainstorm: | Path: Personal (operated as a public fundraiser) | Complexity: L

---

## Problem

**The problem:**
People who want to back a cause rarely get anything memorable or shareable in return — a donation disappears into a list, so there's little emotional pull or social proof to drive more giving.

**Current workaround:**
Standard donation pages (GoFundMe, Razorpay payment pages, charity checkout forms) — a form, an amount, a thank-you receipt.

**Why the workaround fails:**
They're transactional and forgettable. Nothing visible, permanent, or fun results from giving, so donations don't spread or compound socially.

---

## User

**Primary user:**
Internet visitors who'll donate a small amount (₹50+) to get a fun, permanent, shareable artifact — their name rendered live on a beautiful interactive 3D car (a custom, non-branded model). Reached primarily through social sharing and word of mouth, not search.

**Usage frequency and context:**
One-shot, short sessions (under 2 minutes) — land, rotate the car, add a name, share. A small subset return to watch the car fill up or bump their contribution.

**Building for:**
[x] Both (you run/own it; the public uses it)

---

## Core value

**The one thing:**
Donate and instantly see your name rendered permanently on a beautiful 3D car (custom, non-branded) — no signup, no friction.

**How we'll know it's working:**
**Total money raised** is the headline signal — tracked from day one (e.g. "₹X raised in the first month"). A concrete target is an open question (see below). Secondary read: number of names added and share rate.

---

## Features — v1

**In scope (v1):**
| Feature | Why it serves core value |
|---------|------------------------|
| Interactive 3D car viewer (R3F/Three/Drei, PBR, orbit, your custom non-branded GLB) | The "wow" that makes giving feel worth it and shareable |
| Live names rendered at predefined anchor positions, sized by tier | The permanent, visible payoff for donating |
| "Add My Name" flow: name / country / optional message / amount → Zod validation | The single path to the core value |
| Razorpay payment + **server-side webhook verification** | Real money in safely; name only appears after verified payment |
| Position reservation (5–10 min hold) + PostgreSQL transaction on allocation | Prevents two donors buying the same spot under concurrent payments |
| Live updates via Server-Sent Events | Every open browser sees a new name instantly — drives the "live" feeling |
| Basic profanity/abuse filter + sanitization on name & message | Protects you the moment real money + public names go live |
| Minimal admin (hidden, `AUTH_ENABLED` toggle) — hide/delete a name | Lets you pull an abusive name fast on a live, money-collecting site |
| Recent contributors + basic statistics + simple leaderboard | Social proof that compounds giving |
| Funds-to-owner disclosure + minimal legal footer | Required honesty for a public fundraiser collecting real money |

**Navigation structure:**
Single-page homepage: Hero → 3D car Viewer → Contribute CTA → Recent / Leaderboard → Stats → FAQ → Footer. Plus a hidden `/admin`.

**Deferred to v2:**
- Stripe / international payments — Razorpay-only ships the India-first flow faster; add Stripe once the core loop works.
- Infinite overflow BMW #2/#3/#4 — single BMW with N anchors proves the concept; multi-car overflow is a v2 scaling feature.
- Full admin suite (analytics, CSV export, settings, profanity-list management, position editor) — minimal hide/delete is enough for launch safety.
- Auth / user accounts / profiles / contribution history — toggle stays in place; full auth is post-v1.
- Curved-surface text + glow/animate-in effects — polish, not core to the payoff.
- NFT certificates, badges, referrals, coupons, subscriptions, multiple car brands, custom colors/fonts, i18n, dark mode, mobile app — all explicitly future.

**Non-goals (v1 explicitly does NOT include):**
- Not a multi-provider international payment platform (Razorpay/India only in v1).
- Not an account-based product — no login, profiles, or saved history for donors.
- Not an infinitely-scaling multi-car system at launch — one car, fixed anchor set.
- Not a full moderation/admin console — only the minimum needed to remove bad content.
- Not a tax-receipt / registered-charity platform — funds go to the owner with disclosure, not a charity flow.

---

## UI direction

**Platform:** Both — mobile-friendly and desktop, responsive, 60 FPS target on the 3D viewer.
**Session type:** Quick (under 2 min).
**Feel:** Premium.
**UI references:** High-end automotive configurators (Porsche/Tesla build pages), Apple product pages.
**Direction:** A single immersive premium page where the 3D car is the hero; everything else (CTA, leaderboard, stats) supports the moment of adding your name.

---

## Tech stack

**Recommended stack:** (locked by you in business.md)
| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Next.js 15 (App Router) + React 19 + TS + Tailwind | Monolith: frontend + backend in one app |
| 3D | React Three Fiber + Three.js + Drei | Declarative 3D, PBR/HDR/orbit out of the box |
| Client state / data | Zustand + TanStack Query + React Hook Form + Zod | Local 3D/UI state, server cache, validated forms |
| Backend | Next.js Route Handlers + Server Components/Actions | Monolithic API inside the same app |
| Database | PostgreSQL + Prisma ORM | Relational integrity for donations/positions/payments; transactions for race-safety |
| Cache / rate-limit | Redis (Upstash) | IP rate limiting, position reservation, duplicate detection |
| Payments | Razorpay (v1) | India-first, ₹ tiers; webhook-verified |
| Hosting | Vercel + managed Postgres (e.g. Neon/Supabase) + Upstash Redis | Fits Next.js monolith; free/low-cost tiers |

**Third-party services:**
- Razorpay — payment orders + webhook verification (real money).
- Upstash Redis — rate limiting, position holds, dedupe.
- (Optional) UploadThing — only if asset uploads are needed; not required for v1.

**User accounts required:** No (auth scaffolded but disabled via `AUTH_ENABLED=false`).
**Data persistence:** Cloud (PostgreSQL).

---

## Constraints

**Timeline:** A weekend / few days — forces a hard-trimmed v1. You've chosen to go fully live with real Razorpay payments and knowingly accept the associated risk.
**Infrastructure budget:** Free / low-cost tiers (Vercel + managed Postgres + Upstash). Razorpay fees per transaction.
**Platform requirements:** Modern browsers with WebGL; mobile + desktop responsive.
**Compliance:** Real money collection in India implies Razorpay KYC + clear funds-disclosure. No GDPR-class personal data beyond name/country/optional message. Trademark exposure resolved — the car is a custom, non-branded model.

---

## Risks

| Risk | Implication | Mitigation |
|------|-------------|------------|
| **Weekend timeline vs. "real public fundraiser"** | Live real-money site shipped fast may lack refund/dispute handling and pre-publish moderation | You accepted this knowingly; keep at least profanity filter + admin hide/delete + webhook verification as non-negotiable safety floor |
| **Funds go to project owner (not a charity)** | Donor-trust and tax/disclosure issues if not stated clearly | Explicit, prominent "funds go to [owner], not a registered charity" disclosure in UI + FAQ |
| **Payment correctness under concurrency** | Two donors could claim one spot; names appearing without paid/verified money | Position reservation + PostgreSQL transaction + webhook-as-source-of-truth (never trust browser callback) |
| **3D performance on mobile** | Janky < 60 FPS viewer undercuts the premium "wow" | Optimize GLB (draco), lazy-load, cap pixel ratio, test on mid-range mobile early |
| **Abusive / spam names on a live public car** | Reputational damage instantly visible to all visitors | Profanity filter + sanitization + IP rate limit + fast admin hide/delete |

---

## Complexity estimate

**Size:** L

| Signal | Value |
|--------|-------|
| v1 features | 10 |
| Backend needed | Yes |
| Auth needed | No (scaffolded, disabled) |
| Third-party integrations | 2 (Razorpay, Upstash Redis) |
| Real-time / sync | Yes (SSE) |
| Agentic / AI | No |

**Rough build estimate:** Realistically ~1–2 focused weeks for a solid v1; a single weekend means cutting to the bone (single BMW, Razorpay sandbox→live, minimal admin, minimal tests beyond payment-verification).
**Complexity driver:** Real-money payment correctness (webhook verification + position reservation under concurrent payments) combined with a 60 FPS 3D viewer — two hard things in one app.

---

## Open questions

- [ ] **Fundraising target:** What ₹ amount in month 1 counts as success? Needed to make the success metric concrete.
- [ ] **Funds disclosure wording:** Exact on-site statement that donations go to you (the owner), not a charity.
- [ ] **Razorpay account:** Is a KYC-verified Razorpay account ready, or does that need setting up before going live?
- [ ] **Refund/dispute policy:** What happens if a donor wants a refund or disputes a charge? (Even a one-line policy.)

---

## Agentic flag

**Contains AI agent logic:** No
**Next step:** `architect: confirm`
