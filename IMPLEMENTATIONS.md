# DNA CRM — Implementation Tracker

> Items found during the pre-launch audit (2026-03-15). Work through these 1 by 1 before and after going live.

---

## 🔴 Critical — Fix Before Going Live

- [ ] **Rate limiting on public payment endpoints** — `/api/concessions/checkout`, `/api/concessions/reservation-checkout`, `/api/concessions/staff-request` have no rate limiting. Basic in-memory guard to prevent spam/abuse.

- [ ] **Input validation on public endpoints** — `clientName` has no max length, `period` is not validated against enum (`MORNING`/`AFTERNOON`/`FULL_DAY`). Quick fix in checkout and reservation-checkout routes.

- [ ] **Date timezone in reservations API** — `dateRange()` function in `src/app/api/concessions/[slug]/reservations/[id]/route.ts` generates daily entries using UTC, not Lisbon time. Can create entries on wrong dates during DST transitions.

---

## 🟡 Important — Before High Season

- [ ] **GDPR privacy notice** — current notice on public booking page is too vague for Portuguese law. Needs to include: who collects data, why, retention period, who it's shared with (Stripe, Google Calendar), and a contact for deletion requests.

- [ ] **Cancel reservation marks past entries as RELEASED** — when a reservation is cancelled, entries for dates already passed should be marked `COMPLETED` not `RELEASED`. Affects historical reports and accounting.

- [ ] **Success URL exposes customer name and price** — `?name=João&total=33.00` appears in the browser URL after Stripe payment, logged in browser history. Should be fetched server-side using session ID instead.

---

## 🟢 Nice to Have — Can Wait

- [ ] **Email confirmation after beach payment** — Stripe sends a receipt but no booking confirmation email is sent from the CRM after a self-service QR payment.

- [ ] **Multi-spot reservation without full transaction** — when booking multiple spots from the Calculator, spots are validated then created sequentially. A race condition could leave a partial booking. Needs a Prisma transaction.

- [ ] **Override endpoint should require SUPER_ADMIN** — currently any ADMIN can use the `override: true` flag to bypass conflict checks. Should be restricted to SUPER_ADMIN with a mandatory reason field.

- [ ] **Bookings API 2000 booking hard limit** — `GET /api/bookings` has `take: 2000`. No pagination. Won't matter this season but will eventually need addressing.

---

## ✅ Switch to Production (your side — no code changes)

- [ ] **Switch Stripe to live keys** — Vercel → `STRIPE_SECRET_KEY=sk_live_...` + `STRIPE_WEBHOOK_SECRET=whsec_live_...` → redeploy
- [ ] **Create Stripe live webhook** — Stripe Dashboard (live mode) → Webhooks → Add endpoint → `https://app.desportosnauticosalvor.com/api/webhooks/stripe` → event: `checkout.session.completed`
- [ ] **Train staff** on daily control, carry-over, reservations tab, staff requests panel
