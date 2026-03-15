su# DNA CRM — Changelog & Architecture Reference

> **Purpose:** Complete reference for any developer or AI agent continuing work on this codebase. Read this before making changes.

---

## ⚠️ AGENT SAFETY GUIDE — READ FIRST

This section exists because multiple AI agents may work on this codebase at different times. If you are an AI agent, read this before doing anything.

### Project Overview

This is the CRM for **Desportos Náuticos de Alvor (DNA)**, a water sports business in Alvor, Portugal. It manages bookings, partners, statistics, and beach chair concessions. It is a **live production system** used by real staff and partners daily. Mistakes have real business consequences.

- **Framework**: Next.js 14 (App Router), TypeScript, Prisma ORM, PostgreSQL (Supabase), Clerk auth
- **Deployment**: GitHub → Vercel (auto-deploys on every push to `main`)
- **Database**: PostgreSQL hosted on Supabase — there is **no local DB**, all queries hit production
- **Schema changes**: Use `npx prisma db push` — NOT `prisma migrate dev` (non-interactive environment)

### 🔴 NEVER DO THESE THINGS

1. **Never hard-delete database records** — `Booking` and `Customer` use soft-delete (`deletedAt`). A Prisma middleware guard will throw if you try `prisma.booking.delete()` or `prisma.customer.delete()` directly. Use `prisma.booking.update({ data: { deletedAt: new Date() } })` instead.

2. **Never run `prisma migrate dev`** — this environment does not support interactive migrations. Only use `npx prisma db push`.

3. **Never run `prisma migrate reset`** — this **wipes the entire database**. There is no local dev DB — the database is production.

4. **Never run destructive scripts without confirmation** — if a script drops tables, truncates data, or reseeds a model that already has data, stop and ask the user first.

5. **Never push to `main` without the user's explicit approval** — every push triggers an auto-deploy to production.

6. **Never commit `.env` files, credentials, or service account keys** — these have been rotated once already after an accidental exposure.

7. **Never delete the `scripts/` or `prisma/` directories** — they contain seed scripts and schema that are critical for recovery.

8. **Never change the public booking URL pattern** — the route `/concessao/book/[slug]/[spotNumber]` is **permanently fixed**. 88 physical QR codes have been professionally printed and laminated on beach umbrella stakes at Trópico (spots 1–48) and Subnauta (spots 1–40). Changing this route, the slug names (`tropico`/`subnauta`), or the domain (`desportosnauticosalvor.com`) would invalidate all printed QR codes and require a full reprint at significant cost. If the domain ever changes, set up a permanent redirect from the old domain — do NOT just update the code.

### 🟡 PROCEED WITH CARE

- **Schema changes**: Always confirm with the user before editing `prisma/schema.prisma`. A bad `db push` can destroy column data.
- **API route changes**: Test logic mentally before applying. Booking creation and slot availability logic is complex — see the Key Business Logic section below.
- **GCal sync**: Booking create/delete routes sync with Google Calendar. Changing the flow can leave orphaned calendar events or miss cleanup.
- **Partner auth**: Partners only see/edit/delete their own bookings. Never weaken this ownership check.
- **Capacity checks**: Slot overlap logic lives in `src/lib/slots.ts`. Changes here affect all booking validation across the system.

### ✅ SAFE PATTERNS

- Read files before editing them — never assume content
- Make small, targeted changes — one concern at a time
- Check `CHANGELOG.md` (this file) for recent changes before starting work — the previous agent may have left the codebase in a specific state
- After editing API routes, trace the logic manually: auth check → validation → DB query → response
- When in doubt, ask the user rather than guessing

### Context for Resuming Work

The owner (Pedro) switches between AI agents due to usage limits. When you pick up work:
1. Read this file fully
2. Run `git log --oneline -10` to see recent commits
3. Check `git status` for any uncommitted changes
4. Ask the user what they want to work on — do not assume you know the current state

---

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | `"use client"` on all interactive pages |
| Language | TypeScript | Strict mode |
| Auth | Clerk (`@clerk/nextjs` v7) | Middleware protects all routes |
| Database | PostgreSQL via Prisma ORM v5 | Hosted on Supabase |
| Styling | Plain CSS per page | No Tailwind — each page has its own `.css` file |
| Icons | `lucide-react` | |
| Export | `exceljs` (styled Excel) + `xlsx` (client-side) + `jspdf` + `jspdf-autotable` (PDF) | |
| Charts | `recharts` | Statistics page only |
| Email | `resend` | QR Codes + Bug reports |
| QR Code | `qrcode` (generate) + `html5-qrcode` (scan) | Data URI embedding for zero-maintenance |
| Calendar | `googleapis` | Google Calendar two-way sync |
| Deployment | Vercel (auto-deploy on push to `main`) | GitHub → Vercel |
| Schema sync | `prisma db push` | NOT `prisma migrate dev` (non-interactive env) |

---

## Environment Variables (required)

```
DATABASE_URL                  # PostgreSQL connection string (Supabase)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET          # For /api/webhooks/clerk
SHOPIFY_STORE_DOMAIN          # e.g. store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN
SHOPIFY_WEBHOOK_SECRET
GOOGLE_SERVICE_ACCOUNT_EMAIL  # For GCal sync
GOOGLE_PRIVATE_KEY
RESEND_API_KEY                # Bug report emails
RESEND_FROM_EMAIL
RESEND_TO_EMAIL
STRIPE_SECRET_KEY             # Stripe server-side API key (sk_live_...)
STRIPE_WEBHOOK_SECRET         # Stripe webhook signing secret (whsec_...)
```

---

## User Roles (Clerk `sessionClaims.metadata.role`)

| Role | Access |
|---|---|
| `SUPER_ADMIN` | Full access to everything |
| `ADMIN` | Same as SUPER_ADMIN except cannot reset SUPER_ADMIN passwords |
| `PARTNER` | Bookings page (own bookings only), Statistics (filtered), Meu Perfil |
| `USER` | Redirected to `/pending` — no access |

> Roles are stored in Clerk metadata, NOT in the database User table. Always read role from `sessionClaims?.metadata?.role`.

---

## Critical Patterns

### Auth check in API routes
```ts
const { sessionClaims } = await auth();
const role = (sessionClaims as any)?.metadata?.role as string | undefined;
if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### Auth check in page components
```ts
const { user } = useUser();
const role = (user?.publicMetadata as any)?.role as string | undefined;
const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
```

### Prisma client
```ts
import { getPrisma } from "@/lib/prisma";
const prisma = await getPrisma(); // ← MUST await — getPrisma() is async
```
**Never** use `const prisma = getPrisma()` without `await`. TypeScript will compile but runtime will fail.

### CSS convention
Every page/section has a co-located `.css` file imported at the top:
```ts
import "./page-name.css";
```
CSS uses custom properties (`--color-text`, `--color-muted`) for dark theme compatibility.

---

## File Structure

```
prisma/
  schema.prisma               ← Single source of truth for DB schema

src/
  app/
    layout.tsx                ← Root layout: ClerkProvider + Sidebar + CSS
    globals.css               ← Global resets + CSS variables
    page.tsx                  ← Dashboard (bookings list, main page)
    Dashboard.css

    admin/
      logs/page.tsx           ← Override logs viewer (ADMIN only)
      users/page.tsx          ← User management, role assignment (ADMIN only)

    concessao/
      page.tsx                ← Selector: Trópico | Subnauta | Definições
      concessao.css
      [slug]/
        page.tsx              ← Detail: 4 tabs (Controlo | Reservas | Preçário | Calculadora)
        concessao-detail.css
        components/
          DailyControl.tsx    ← Visual spot grid + export button
          SpotPanel.tsx       ← Side drawer: assign/carry-over/release spot
          Reservations.tsx    ← Reservations table + create/edit drawer + Excel export
          PriceList.tsx       ← Multilingual price table (PT/EN/ES/FR/DE/ZH/RU)
          Calculator.tsx      ← Budget calculator with discount options

    partners/page.tsx         ← Partner management
    pending/page.tsx          ← "Access pending" page for USER role
    profile/page.tsx          ← User profile (name sync, stats)
    schedule/page.tsx         ← Weekly open/close schedule
    services/page.tsx         ← Service catalogue
    statistics/page.tsx       ← Revenue stats, charts, filters
    sign-in/[[...sign-in]]/page.tsx
    sign-up/[[...sign-up]]/page.tsx

    api/
      admin/
        fix-encoding/route.ts     ← POST: fix UTF-8 mojibake in DB
        override-logs/route.ts    ← GET: override logs list
        setup/route.ts            ← POST: one-time admin setup
        users/route.ts            ← GET: all Clerk users
        users/assign-role/route.ts ← POST: set role in Clerk metadata
        users/reset-password/route.ts ← POST: SUPER_ADMIN only

      bookings/
        route.ts              ← GET all bookings (with filters)
        create/route.ts       ← POST create booking
        delete/route.ts       ← DELETE booking
        update/route.ts       ← PUT update booking
        attendance/route.ts   ← POST toggle showedUp
      cron/
        follow-up/route.ts    ← GET: automated post-activity thank you emails
      gcal/
        webhook/route.ts      ← POST: Google Calendar push notifications (real-time sync)

      bug-report/route.ts     ← POST: sends email via Resend

      concessions/
        route.ts              ← GET all concessions (with spot count)
        seed/route.ts         ← POST: one-time seeder (creates concessions + spots)
        [slug]/
          route.ts            ← GET concession+spots, PUT update pricing
          entries/
            route.ts          ← GET by date, POST new entry (conflict detection)
            [id]/
              route.ts        ← PUT update entry, DELETE (soft: RELEASED)
              carry-over/route.ts ← POST: FULL_DAY → MORNING + new entry tomorrow
          reservations/
            route.ts          ← GET filtered list, POST create + generate daily entries
            [id]/route.ts     ← PUT update, DELETE cancel + release future entries
          export/route.ts     ← GET Excel (2 sheets: spot list + daily summary)

      gcal-staff/route.ts     ← GET/POST/DELETE Google Calendar staff resources
      partners/
        route.ts              ← GET all partners
        create/route.ts       ← POST create partner
      schedule/route.ts       ← GET/PUT weekly schedule
      services/
        route.ts              ← GET/POST services
        [id]/route.ts         ← PUT/DELETE service
        seed/route.ts         ← POST seed from Shopify CSV
        seed-slots/route.ts   ← POST seed slot config
      shopify/
        sync/route.ts         ← POST sync Shopify orders (paginated, all orders)
        webhook/route.ts      ← POST Shopify webhook (PUBLIC — no auth)
      slots/route.ts          ← GET available booking slots (conflict-aware)
      stats/route.ts          ← GET revenue statistics
      webhooks/clerk/route.ts ← POST Clerk webhook (user sync)
      debug-db/route.ts       ← GET debug endpoint

  components/
    Sidebar.tsx               ← Navigation sidebar (client component)

  lib/
    prisma.ts                 ← getPrisma() singleton — always await!
    shopify.ts                ← syncShopifyOrders()
    auth.ts                   ← Auth helpers
    calendar.ts               ← Google Calendar integration
    export.ts                 ← exportToExcel(), exportToPDF()

  middleware.ts               ← Clerk middleware + role-based route protection
```

---

## Database Schema (Prisma)

### Core Models

**User**
- `id`, `name`, `email`, `password`, `role`, `image`, `partnerId`, `createdAt`, `updatedAt`
- Linked to `Partner` via `partnerId`
- Role stored here is secondary — Clerk metadata is authoritative

**Partner**
- `id`, `name`, `email`, `phone`, `address`, `website`, `commission` (Float, default 10%), `createdAt`, `updatedAt`
- Has many `Booking[]` and `User[]`

**Booking**
- `id`, `customerName`, `customerEmail`, `customerPhone`, `activityDate`, `activityTime`, `pax`
- `status` — `"CONFIRMED"` | `"CANCELLED"` | `"NO_SHOW"`
- `source` — `"MANUAL"` | `"SHOPIFY"` | `"PARTNER"`
- `shopifyId` (unique), `totalPrice`, `notes`, `activityType`, `partnerId`, `serviceId`
- `orderNumber`, `quantity`, `country`, `showedUp` (Boolean?)
- `isEdited` (Boolean) + original values: `originalActivityType`, `originalPax`, `originalQuantity`, `originalTotalPrice`, `originalActivityDate`, `originalActivityTime`
- `gcalEventIds` (JSON string array), `gcalCalendarIds` (JSON string array)
- `followUpSent` (Boolean, default false)
- `activities` — Linked to `BookingActivity[]` (one-to-many)

**BookingActivity**
- `id`, `bookingId`, `serviceId`, `activityType`, `activityDate`, `activityTime`, `pax`, `quantity`, `totalPrice`
- `gcalCalendarIds`, `gcalEventIds`, `createdAt`, `updatedAt`

**Service**
- `id`, `shopifyHandle`, `name`, `variant`, `sku` (unique), `price`, `imageUrl`, `category`, `isActive`
- `durationMinutes`, `unitCapacity`, `capacityGroup`, `slotGapMinutes`
- `serviceCloseTime` — per-service close time override (e.g. `"17:40"`)
- `gcalEnabled` (Boolean) — whether to sync to Google Calendar
- `minPax`, `maxPax` — for pax-priced services (sofa/banana)

**Schedule**
- `id`, `dayOfWeek` (0=Sun…6=Sat, unique), `openTime`, `closeTime`, `isOpen`

**GcalStaff**
- `id`, `name`, `calendarId`, `capacityGroup?`, `serviceId?`, `order`
- `channelId`, `resourceId`, `expiration` (for Webhook watch)
- Maps a physical resource (e.g. "Jetski 1") to a Google Calendar
- `capacityGroup` is preferred over `serviceId` — covers all service variants in the group with one row
- Rows are seeded via `POST /api/admin/seed-gcal-staff` from `GCAL_STAFF_CONFIG` env var

**OverrideLog**
- `id`, `bookingId`, `clerkUserId`, `userName`, `reason`, `serviceId?`, `serviceName?`, `slotTime`, `date`, `createdAt`
- Written when admin overrides a slot conflict

### Concession Models

**Concession**
- `id`, `slug` (unique: `"tropico"` | `"subnauta"`), `name`, `location`
- `rows`, `cols` — grid dimensions
- Prices: `priceFull`, `priceMorning`, `priceAfternoon`, `priceExtraBed`, `priceOneBed`

**ConcessionSpot**
- `id`, `concessionId`, `spotNumber`, `row`, `col`, `isActive`
- Unique on `[concessionId, spotNumber]`

**ConcessionEntry** — a single day assignment
- `id`, `concessionId`, `spotId`, `date` (YYYY-MM-DD), `period` (`MORNING`|`AFTERNOON`|`FULL_DAY`)
- `clientName`, `clientPhone?`, `bedConfig` (`TWO_BEDS`|`ONE_BED`|`EXTRA_BED`)
- `totalPrice`, `isPaid`, `notes?`
- `reservationId?` — links to a ConcessionReservation if from a multi-day booking
- `isCarryOver` (Boolean) — created by carry-over flow
- `status` — `ACTIVE` | `RELEASED` | `CARRIED_OVER`

**ConcessionReservation** — multi-day booking
- `id`, `concessionId`, `spotId`
- `clientName`, `clientPhone?`, `clientEmail?`
- `startDate`, `endDate` (YYYY-MM-DD), `period`, `bedConfig`
- `totalPrice`, `isPaid`, `notes?`
- `status` — `ACTIVE` | `COMPLETED` | `CANCELLED`
- Creating a reservation auto-generates `ConcessionEntry` for every day in range

---

## Concession Data

| Concession | Slug | Location | Grid | Spots |
|---|---|---|---|---|
| Trópico | `tropico` | Poente | 3 rows × 16 cols | 48 |
| Subnauta | `subnauta` | Nascente | 5 rows × 8 cols | 40 |

**Pricing defaults:**

| | Full Day | Morning | Afternoon | Extra Bed | 1 Bed |
|---|---|---|---|---|---|
| Trópico | 16.50€ | 11.00€ | 11.00€ | 7.00€ | 8.00€ |
| Subnauta | 18.50€ | 12.00€ | 12.00€ | 8.00€ | 9.00€ |

**Seed:** call `POST /api/concessions/seed` once as ADMIN after first deploy to populate DB.

---

## Middleware Route Protection

```
/sign-in, /sign-up, /api/shopify/webhook, /api/webhooks/*   → PUBLIC
/pending                                                     → any authenticated user
/concessao, /concessao/*                                     → ADMIN, SUPER_ADMIN
/admin, /admin/*                                             → ADMIN, SUPER_ADMIN
/api/admin/*                                                 → ADMIN, SUPER_ADMIN (returns 403 JSON)
everything else                                              → must have role (not USER/undefined)
```

---

## Sidebar Navigation (Sidebar.tsx)

| Item | Route | Visibility |
|---|---|---|
| Dashboard | `/` | All |
| Serviços | `/services` | All |
| Parceiros | `/partners` | Non-partner |
| Estatísticas | `/statistics` | All |
| Meu Perfil | `/profile` | All |
| Sync Shopify | (button) | Non-partner |
| **Concessão** | `/concessao` | **Admin only** |
| Utilizadores | `/admin/users` | Admin only |
| Horário | `/schedule` | Admin only |
| Logs Override | `/admin/logs` | Admin only |
| Reportar Bug | (modal) | All |

---

## Key Business Logic

### Booking Slots
- `GET /api/slots` returns available time slots for a service on a date
- Slots respect service `durationMinutes`, `unitCapacity`, `capacityGroup`, `slotGapMinutes`, `serviceCloseTime`
- Also checks Google Calendar events if `gcalEnabled = true` on the service
- Override logs written when admin bypasses a conflict

### Shopify Sync
- `POST /api/shopify/sync` fetches ALL orders (paginated, 250/page) from Shopify Admin API
- Upserts bookings by `shopifyId`
- Preserves manual edits (`isEdited = true` bookings are not overwritten)
- Webhook at `/api/shopify/webhook` handles real-time order creation/updates

### Google Calendar Sync
- Two-way: bookings create GCal events; Meety bookings read back into slot availability
- Staff/resources managed via `GcalStaff` table
- Calendar IDs stored per booking in `gcalEventIds`/`gcalCalendarIds` (JSON arrays)

### Partner System
- Partners see only their own bookings (filtered by `partnerId` from Clerk JWT)
- Commission tracked as percentage on Partner record
- No-shows excluded from commission calculation
- Partner bookings created "on behalf of partner" by admin, or via partner's own login

### Carry-Over Flow (Concession)
1. Staff clicks "Carry-over da Tarde" on a FULL_DAY spot
2. Selects target spot + date (tomorrow)
3. API: original entry period → `MORNING`, status → `CARRIED_OVER`
4. New `ConcessionEntry` created: tomorrow, target spot, period=`MORNING`, `isCarryOver=true`, `isPaid=true`

### Spot State Logic (Concession)

A spot on a given date can hold up to **2 active entries**: one `MORNING` + one `AFTERNOON`, OR one `FULL_DAY`.

| State | Colour | Condition |
|---|---|---|
| `free` | dark surface | no active entries |
| `morning` | amber | MORNING entry (no reservation) |
| `afternoon` | blue | AFTERNOON entry (no reservation) |
| `full` | purple | FULL_DAY entry (no reservation) |
| `reserved` | red | any period entry linked to a `ConcessionReservation` (FULL_DAY or single period) |
| `split` | amber top / blue bottom | both MORNING + AFTERNOON occupied (regardless of reservation) |

**Split cell display:** the grid card is split horizontally — top half shows morning client, bottom half shows afternoon client.

**SpotPanel behaviour:**
- FREE → full booking form (period selector: Morning / Afternoon / Full Day)
- MORNING only → shows morning info + "Estender para Dia Inteiro" + "Libertar Manhã" + **"+ Tarde livre — Registar cliente"** expander
- AFTERNOON only → shows afternoon info + "Libertar Tarde" + **"+ Manhã livre — Registar cliente"** expander
- SPLIT → shows both periods' info separately, each with its own "Libertar" button
- FULL DAY → shows info + "Carry-over da Tarde" + "Libertar Tudo"

### Reservation Conflict Resolution

When `POST /api/concessions/[slug]/reservations` detects a period conflict:
1. All entries for the concession across the requested dates are batch-fetched in one query
2. Blocked dates per spot are computed in memory (no N+1 queries)
3. Returns **HTTP 409** with `{ error, message, conflictDates, alternatives[] }`
4. `alternatives[]` lists up to 6 other spots sorted by fewest blocked dates — spots free for all days listed first
5. The Reservations drawer shows the alternative list; clicking "Usar este" swaps the spot in the form instantly

Conflict rule: `existingPeriod === "FULL_DAY" || existingPeriod === newPeriod || newPeriod === "FULL_DAY"`

### Booking Edit Tracking
- When a booking is edited, original values saved to `original*` fields
- `isEdited = true` flag set
- Dashboard shows ghost row with original values struck through
- Shopify sync skips `isEdited` bookings

---

## Feature History (by commit)

| Commit | Feature |
|---|---|
| `90b43d4` | Initial auth, dashboard, Shopify sync |
| `48e2e2c` | Partner management, Excel/PDF export |
| `1d9a1ce` | Google Calendar initial setup |
| `c73a975` | GCal sync + Meety timeslots |
| `bc4c4bc` | Bidirectional GCal sync |
| `c5e7b87` | Partner system (filtered bookings, commission stats) |
| `cb3373e` | Auto-create Partner record on role assignment |
| `23f9121` | Partner info form, admin booking on behalf |
| `7cd0fb9` | No-show exclusion from commission + no-show stats |
| `ba51e91` | Slot grid UX, partner past-time restrictions |
| `ac98793` | Redesigned pending page, Meu Perfil, password reset |
| `30eb615` | Partner security, modal date fix, bug report modal |
| `29172b7` | Edit drawer on booking rows (replaced delete button) |
| `74d0380` | Ghost original row on edited bookings |
| `c3c1be2` | Auto-price calculation with discount bar |
| `03d644f` | Preserve manual edits during Shopify sync |
| `2bef82e` | Attendance toggle (showedUp) |
| `cab9ff5` | Full scheduling system (open/close times per day) |
| `c73a975` | GCal timezone fix for Portugal |
| `9cdc54b` | Stats: service grouping, date range filter, country |
| `ff946a2` | Shopify pagination (all orders, not just 250) |
| `08d9574` | Timezone fix for GCal event times |
| `0703bf2` | Pax-based pricing (sofa/banana), min/max pax |
| `b30eed4` | No-show zeroes price, projected revenue, balanced columns |
| `5265655` | Fix top-customers grouping by name when email absent |
| `1c3bbdc` | Color-coded partner badges on users page, UTF-8 fix |
| `e64ed54` | Profile name sync, stats default period, Resend bug reports |
| `f1cb344` | Current-month orange highlight, day-accordion, past-years collapsed |
| `eb09dcd` | Fix current-month highlight (always orange regardless of future bookings) |
| `d7b89de` | **Concessão module** (full beach chair management) |
| `ac91e04` | Fix: await getPrisma() in all concession API routes |
| `93f6a69` | Concessão seed button on empty state, TreePalm icon, sidebar overlap fix, Trópico first |
| `fb6257b` | Dropdown text fix, color swap (full=purple, reserved=red), R badge, calendar view in Reservations, Calculator date inputs + Proceed button |
| `d7c3e21` | Split-cell grid (morning/afternoon halves), book second period from SpotPanel, reservation conflict with smart alternatives |
| `ba927c8` | Bug fixes: timezone (UTC→Lisbon), cancel releases all entries, walk-in AFTERNOON blocked by active FULL_DAY, daily note in localStorage, carry-over of carry-over blocked, date fields disabled in edit mode |
| `7f9d5ea` | Fix Calculator price passthrough (skipAutoCalcRef), "+ Adicionar Chapéu" button in reservations form, reservation date/period edit (PUT regenerates daily entries), note + legend moved below spot grid |
| `14803f9` | Bug 5: pre-validate all spots before creating any reservation (avoid partial bookings), extra spot creation reports failures explicitly |
| `d4a0dec` | Visual Improvements: Loading Skeletons (V1), Toast Notifications (V2), Concession Themes (V4: Trópico orange, Subnauta blue), Print-Optimized CSS (V5) |
| `d261dce` | **Responsiveness & Mobile Optimization**: Mobile-First Sidebar, Adaptive Concessão Grid, Responsive Statistics, Mobile Modals/Forms, Layout adjustments across all modules |
| `59486ea` | **Security**: Removed `_CRM_V1_SNAPSHOT.zip` from entire git history (filter-branch, force push), rotated exposed GCP service account key, added `*.zip` to `.gitignore` |
| `QR-01` | **QR Check-in System**: Integrated automated QR email delivery, Data URI embedding (zero-file maintenance), and professional in-CRM scanner. |
| `QR-02` | **Payment Breakthrough & Partner Attribution**: Price breakdown (Paid vs Pending), real partner names in check-in, and UX improvements (Close button). |
| `BKG-03` | **Slot Logic & Partner Tools**: Meety-sync slot intervals, Quick Apply commission, Country Selector v2 (image flags + expanded list), and mobile UI fixes. |
| `BKG-04` | **Security & UX**: Enhanced security for attendance toggle, improved mobile UI, and refined partner commission application. |
| `STB-V3` | **Stable V3 Release**: Standardized activity logic, improved scanner error handling, and fixed order edit pre-filling. |
| `ef6e8c6` | **Real-time Sync & Automation**: GCal Webhooks, Staff Audit v2, Server Search, Follow-up Email |
| `5e4531c` | **Multi-Activity Booking System**: Support for multiple products per booking, individual capacity checks, and GCal sync per activity. |
| `f3fb46e` | **Shopify Sync Enrichment**: Extract `postalCode`, `discountCodes`, and `country` (billing → shipping fallback) from Shopify orders. |
| `fc0a24c` | **Fix**: Availability API now flattens `BookingActivity` rows for capacity checks — sub-activities were previously invisible to slot overlap logic. |
| `0adb517` | **Fix**: Prevent GCal double-booking — track assigned calendar IDs within a booking's sync loop so two same-service activities distribute across different staff calendars. |
| `dbe4ce8` | **Security Audit Fixes**: Services POST whitelisted + locked to ADMIN; `debug-db` endpoint locked to ADMIN; email sender replaced with production domain; bug-report sender corrected. |
| `1428707` | **Soft-Delete Protection**: `deletedAt` added to `Booking` and `Customer`. Deletes now soft-hide records. Prisma middleware guard throws on any `prisma.booking.delete` / `prisma.customer.delete` call at runtime to prevent accidental hard-deletes. |
| `e86a855` | **Fix**: `slotGapMinutes` and `unitCapacity` use `undefined` instead of `null` in services POST (non-nullable schema fields with defaults). |
| `af04721` | **Availability Booking Panel**: Expanded the `/availability` booking drawer to match the full dashboard booking form — CountrySelector, partner dropdown (admin only), total price, discount, booking fee, and notes fields. |
| `dd2b032` | **Security & Data Integrity Audit**: Partner ownership enforcement on delete/update (partners can only modify their own bookings); `deletedAt: null` added to all 4 capacity-check queries; status/discount validation on update; multi-activity GCal event cleanup on booking delete. |
| `8257a3d` | **Concession Icons**: Sidebar + page header icon changed to `Sun`; Subnauta card/detail uses `Waves`, Trópico keeps `TreePalm`. |
| `9b0fc5f` | **Partner Permission Fix**: Partner dropdown (book on behalf) hidden from PARTNER role in both dashboard modal and availability page. Discount and commission fields also hidden from partners. Bookings in availability page are correctly tied to the partner's own account via Clerk session. |
| `STB-V4` | **Stable V4**: Concessão module complete (themes, bugs fixed, mobile), partner permissions locked down, soft-delete protection active. Stripe self-service integration begins next. |

### Crisis Recovery & System Stabilization (2026-03-12)

**[CRITICAL] Database Deletion & Recovery**:
- **Incident**: During an environment/script update, the database was accidentally wiped, resulting in temporary loss of all configuration and activity data.
- **Resolution**: 
    - Full system re-seed using `scripts/seed-precise-meety.js` to restore services and staff metadata.
    - Successful restoration of **139 bookings** and the "Experience Algarve" partner record.
    - Automated repair of **Orphaned Bookings** to re-link all transactions to the Customer Database.
- **Security**: 
    - Permanently excluded `/scripts`, `/tmp`, and `*.db` from the repository via updated `.gitignore`.
    - Rotated and securely applied new Google Service Account credentials via `scripts/apply-rotated-key.js`.

**System Logic & Automation**:
- **Meety Mastery**: Implemented precise mirroring of Meety's interval logic. Used **negative gaps** (e.g., -30 for 1h services) to align with 30-min overlaps and added a **10-minute turnaround buffer** (except for 1h variants) to prevent overbooking overlaps.
- **Automated Totals**: The **Total Price** field is now read-only and calculates in real-time. It automatically handles the math for: *Activities + Discounts - Commission (if applied)*.
- **Manual Commission Hook**: Replaced auto-commission with a manual **"Calcular"** button. This gives staff control over when to apply partner fees, which are then subtracted from the final total as requested.
- **Stats Correction**: Refined dashboard statistics to restore revenue visibility for past confirmed bookings that were previously misclassified as no-shows.

**Premium UI Refinements**:
- **Glassmorphism V2**: Overhauled Modal UI with `backdrop-filter: blur(28px)`, deep shadows, and internal scroll management (`max-height: 90vh`). This fixes the "content leaking out of modal" issue on small screens.
- **Visual Feedback**: Added teal color coding for read-only calculated fields and improved component spacing for a high-end feel.
- **Partner Tools**: Added "Edit Partner" functionality with a dedicated **Pencil icon** and Patch API for real-time detail updates.

### Feature Details (Recent)

#### Multi-Activity Booking System (2026-03-12)
- **Multi-Product Transactions**: Bookings can now contain multiple independent activities (e.g., Jetski 20min + Jetski 30min).
- **Independent Capacity Management**: Each activity within a booking undergoes its own slot availability check across all relevant services.
- **Enhanced GCal Synchronization**: Automated creation/update/deletion of unique Google Calendar events for every activity in a booking.
- **Improved Dashoard UX**:
    - **Creation**: "+ Adicionar Outra Atividade" button with smart date/time inheritance from the primary item.
    - **Editing**: Redesigned Edit Drawer to manage (add, remove, or modify) activities individually.
    - **Reporting**: List views and mobile cards now stack all activities within a single booking row.
- **Stats V2**: All dashboard metrics (Revenue by Service, Top Services, Revenue by Country) now correctly aggregate data at the activity level.

#### Real-time Sync & Automation (2026-03-12)
- **GCal Push Notifications**: Implemented Google Calendar Watch API (Webhooks). Local availability cache now updates instantly when calendar changes occur externally.
- **Server-Side Search**: Moved dashboard booking search to the backend (Prisma) with a 400ms debounce. Drastically improves dashboard performance for high booking volumes.
- **Customer Database Sorting**: Implemented interactive multi-column sorting (Name, Email, Country, Source, Date) in the Customer Hub. Handles toggling ASC/DESC on the server side across paginated results.
- **Enhanced Audit Trail**: Booking updates now log full "Before/After" diffs. Attendance toggles (showedUp) are now audited with timestamps.
- **Automated Follow-ups**: 
    - New high-converting email template thanking customers and requesting Google reviews.
    - Automated cron route (`/api/cron/follow-up`) to process yesterday's customers.
- **Schema Hardening**: Added `followUpSent` tracking to Bookings and Webhook metadata to `GcalStaff`.

#### Stable V3 Release (2026-03-12)
- **Order Edit Pre-filling Fix**: Standardized activity name separators to a consistent em-dash (` — `) and improved service matching logic in the Dashboard to handle legacy data during edits.
- **Scanner UI Improvements**: Added Portuguese-localized error messages, hardware detection (no camera found), and action buttons (Retry / Back to Dashboard) for a smoother check-in experience.
- **Jetski Service Optimization**: 
    - Standardized 15/20/30 min variants with **5 min before + 5 min after** buffers (10 min total gap).
    - Aligned CRM frequencies to mirror Meety (15-min and 30-min start intervals).
    - Restored 1-hour variant to exactly 60m with 30-min slots (no extra buffer).
    - Hardened 10-minute variant with a 10-minute pre-booking turnaround.

#### Slot Logic, Mobile UX & Partner Tools (2026-03-11)
- **Slot Synchronization**: Aligned Service durations and gaps to match Meety's 10-minute intervals with 5-min buffers (e.g., 10min activity = 20min duration / -10min gap).
- **Mobile Dashboard Fix**: Resolved duplicated booking cards displayed on mobile devices.
- **Enhanced Country Selector**: Replaced emoji flags with high-quality icons for Windows compatibility, swapped field order for better UX, and expanded the list to 50+ countries (all EU + major globals).
- **Quick Apply Commission**: Added lightning (Zap) button to booking forms that automatically calculates partner commission based on their stored rate.
- **Security Hardening**: Locked `/api/bookings/attendance` to prevent partner accounts from marking attendance.

#### Payment Breakthrough & Partner Attribution (2026-03-11)
- **Price Breakdown**: Automated calculation of Amount Paid (Sinal) vs Pending (Na Praia) displayed in both confirmation emails and the staff check-in view.
- **Partner Visibility**: Replaced generic "PARTNER" labels with actual partner names (e.g., "Hotel Alvor") for better attribution and transparency.
- **Booking Edit v2**: Redesigned the Edit Drawer with a 2-column layout, fixing z-index issues, adding partner selection, and enabling real-time price recalculation.
- **Staff UX**: Added a close button (X) to the check-in result screen for a faster "scan-verify-repeat" workflow.

#### QR Check-in System (2026-03-10)
- **Automated Delivery**: Confirmation emails now include an embedded QR code (Data URI format) for zero-maintenance file tracking.
- **Embedded Scanning**: New `/scanner` route using `html5-qrcode` for professional in-app QR scanning.
- **Digital Check-in Card**: Mobile-optimized `/check-in/[id]` page for staff to verify booking details and toggle attendance.
- **Vercel Optimized**: Logic redesigned to work without filesystem access, ensuring 100% compatibility with cloud deployments.

#### Responsiveness & Mobile Optimization (2026-03-09)
- **Mobile-First Sidebar**: Implemented a slide-in mobile navigation menu with overlay and toggle button.
- **Adaptive Concessão Grid**: Improved beach chair management view for tablets and phones with horizontal scrolling and full-width reservation drawers.
- **Responsive Statistics**: Refined charts and tables to stack vertically and scroll horizontally on smaller viewports.
- **Mobile Forms**: Optimized "New Reservation" and "Edit" modals to stack fields on narrow screens.
- **Layout Adjustments**: Removed fixed margins and optimized paddings across all modules (Profile, Services, Dashboard) for a seamless mobile experience.

#### Visual Improvements (2026-03-09)
- **Loading Skeletons (V1)**: Replaced spinners with skeleton loaders for smoother perceived performance.
- **Toast Notifications (V2)**: Integrated a custom toast system for non-intrusive alerts.
- **Concession Themes (V4)**: Applied distinct color themes (Trópico: Orange, Subnauta: Blue) to concessions.
- **Print-Optimized CSS (V5)**: Added print-specific styles for cleaner reports.


---

## Known Gotchas

1. **`getPrisma()` must be awaited** — it's `async` even though it just returns a singleton. `const prisma = await getPrisma()` — always.

2. **Role is in Clerk metadata, not DB** — `sessionClaims?.metadata?.role` in API routes, `user?.publicMetadata?.role` in client components. The `User.role` in Prisma is not used for auth decisions.

3. **`prisma db push` not `prisma migrate dev`** — the environment is non-interactive. Schema changes: edit `schema.prisma`, run `npx prisma db push`.

4. **Shopify sync skips `isEdited` bookings** — if a booking was manually edited, sync will never overwrite it.

5. **No-shows have `totalPrice = 0`** — set at attendance toggle time. Excluded from partner commission.

6. **Concession spots must be seeded** — call `POST /api/concessions/seed` once after first deploy. Idempotent — safe to call again.

7. **`/api/shopify/webhook` is public** — intentionally excluded from auth middleware. Verified by HMAC signature inside the handler.

8. **Partner `partnerId` comes from Clerk JWT** — not from the database User table. Read as `(sessionClaims as any)?.metadata?.partnerId`.

9. **CSS is co-located per page** — do not add global styles to `globals.css` unless truly global. Each page folder has its own `.css` file.

10. **`export const dynamic = "force-dynamic"`** — required on all API routes that read from DB to prevent Next.js static caching.
11. **Multi-Activity Stats aggregation** — many metrics now iterate over `b.activities`. When calculating per-service popularities, we count each activity individually rather than the single parent booking.

12. **Attendance (showedUp) at Booking level** — Currently, attendance is toggled for the entire booking transaction (all activities together), not per individual activity item.

13. **Soft-delete on Booking and Customer** — `DELETE` endpoints set `deletedAt` instead of removing records. All `GET` queries filter `deletedAt: null`. A Prisma middleware guard throws at runtime if code tries to call `prisma.booking.delete` or `prisma.customer.delete` directly.

14. **Stripe base URL is hardcoded** — both `checkout/route.ts` and `reservation-checkout/route.ts` use `"https://app.desportosnauticosalvor.com"` directly (not `NEXT_PUBLIC_BASE_URL`) to ensure `success_url` and `cancel_url` never redirect to the Shopify domain.

15. **GcalStaff rows are not protected from DB resets** — if `prisma migrate reset` or `prisma db push --force-reset` is ever run, this table is wiped. Recovery: run `fetch('/api/admin/seed-gcal-staff', {method:'POST'})` from the browser console (SUPER_ADMIN). The calendar IDs live in the `GCAL_STAFF_CONFIG` Vercel env var — never in the repo.

16. **Beach time cutoffs** — `isPastCutoff()` on the public booking page locks MORNING and FULL_DAY at **13:00** Lisbon time, AFTERNOON at **18:00** (1-hour buffer before each period ends). When all periods are past cutoff, the page shows a "beach closed" message and suggests switching to the Reserva tab.

---

## Feature History (continued)

| Commit | Feature |
|---|---|
| `cb4647c` | Fix: seat terminology in success page; add `sessionType` to daily checkout metadata |
| `035ab68` | Fix: replace remaining "umbrella" with "seat" in English `staffSent` translation |
| `03bcbd6` | Fix: center language selector on booking page |
| `c7bd6a6` | Fix: use "seat" instead of "umbrella" in English translations |
| `a7a25be` | Fix: update Stripe redirect fallback domain to `app.desportosnauticosalvor.com` |
| `f921c29` | Perf: merge 3 DailyControl API calls into single `/daily-summary` endpoint (Promise.all); lazy-load Statistics with next/dynamic |
| `7d2638d` | Fix: beach-closed message when all periods past cutoff; hardcode base URL in both checkout routes |

### Booking Page Cutoffs, Clerk Production & Auth Styling (2026-03-14)

#### Time Cutoffs — 1-Hour Buffer Before Period Start
- **MORNING / FULL_DAY**: `isPastCutoff` now locks at **13h** (was 14h). Customers can no longer select morning or full-day after 13:00 Lisbon time.
- **AFTERNOON**: cutoff moved to **18h** (was 19h). Afternoon locks 1 hour before the 19h end of period.
- **Warning window**: "Manhã disponível até às 13h" warning shown between 12h–13h (was 12h–14h).
- **All 5 languages updated**: `morningOnlyWarning` and `availUntil2pm` strings changed to reflect 13h / 1pm.

#### Booking Page — Header Fix
- Header subtitle now uses the translated `t.spotLabel` instead of the hardcoded Portuguese "Chapéu". All 5 languages now show the correct word (Spot / Parasol / Sombrilla / Parasol / Sonnenschirm).

#### Checkout — Reservation Conflict Check
- `POST /api/concessions/checkout` (daily mode) now also checks `ConcessionReservation` records for conflicts, not just `ConcessionEntry`. Previously a spot blocked by an active multi-day reservation could still be booked via the daily checkout if no daily entry had been generated yet.

#### Bug Investigation & Data Cleanup
- **Root cause found**: Subnauta spot 2 appearing "fully booked" when morning was visually free — caused by an active `ConcessionReservation` (not an entry) covering that date and period. The spot-availability route queries both `ConcessionEntry` and `ConcessionReservation`; the vacate script had only released entries, not reservations.
- **Cleanup**: Released 55 active test entries and cancelled 4 active reservations covering the test date.

#### Clerk — Migration to Production Instance
- Created a new Clerk **Production** instance (cloned from Development) for `app.desportosnauticosalvor.com`.
- Added 5 DNS CNAME records at dominios.pt: `clerk`, `accounts`, `clkmail`, `clk._domainkey`, `clk2._domainkey`.
- DNS verified; SSL certificates issued automatically by Clerk.
- Updated Vercel environment variables: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` rotated to production keys.
- **Note**: User accounts do not transfer between Clerk instances — admin accounts were re-created and assigned `{"role": "SUPER_ADMIN"}` via Clerk Dashboard → Users → Public metadata.

#### Clerk — Dark Theme Styling
- Extracted shared appearance config to `src/app/clerkAppearance.ts` — used by both sign-in and sign-up pages.
- Sign-in and sign-up pages now have a fully dark-themed Clerk card: dark background (`#111827`), blue primary, slate text, card border and deep shadow.
- **User button popup** (in `layout.tsx` `ClerkProvider`): dark card (`#1e1e2e`), white text on action buttons, "Powered by Clerk" footer hidden.
- Fixed: 2FA code digits were black-on-dark (unreadable) — resolved by `colorText: "#f1f5f9"` in variables.
- Fixed: "Last used" pill on social buttons had black text — resolved with `badge` element override (`color: "#f1f5f9 !important"`).

#### Auth Pages — Footer & Branding
- Added footer section to sign-in and sign-up pages:
  - Amber warning: "⚠️ Ferramenta interna. Se não é parceiro, não faça login."
  - Copyright line with Sueste Creative Agency credit and link.
- Added `src/app/auth.css` with `.auth-root` (dark background + glow effect), `.auth-logo`, `.auth-footer`, `.auth-footer-warning`, `.auth-footer-copy` styles.

### Security, GDPR & Auth Fixes (2026-03-15)

#### Clerk UserProfile Modal — Dark Theme (Final Fix)
- Previous per-element `appearance.elements` API only covered known Clerk keys and left several text nodes gray.
- Replaced with blanket global CSS rules in `globals.css` targeting `.cl-modalContent *` and `.cl-userProfile-root *` with `color: #e2e8f0`. Covers every text node regardless of internal Clerk class name.
- Fixed: "Account / Manage your account info." subtitle, email address text, "First name / Last name" labels, section titles, dividers, form inputs, close button.

#### Attendance Toggle — Optimistic UI Fix
- `handleAttendance` on the Dashboard was updating only `showedUp` in local state after the API call.
- The attendance API also updates `totalPrice` (sets to 0 for no-show, restores from activities when re-marking present). UI now reads both `showedUp` and `totalPrice` from the API response so the price column updates immediately without a page refresh.

#### Security — Removed Debug Endpoint
- `src/app/api/debug-db/route.ts` deleted entirely. This endpoint exposed database schema and row counts without meaningful auth protection. No production value.
- Removed `/api/debug-(.*)` from middleware public patterns.

#### GDPR — Privacy Policy & Data Erasure Tool
- **Privacy policy page** (`/privacidade`, public): Portuguese GDPR-compliant page listing data collected, legal basis (Art. 6(1)(b)), third-party processors (Stripe, Supabase, Vercel, Google, Shopify, Resend), retention periods (7 years for financial records), and data subject rights. Contact: `booking@desportosnauticosalvor.com`.
- **Data erasure tool** (`/admin/gdpr`, SUPER_ADMIN only): Search by name/email/phone. Preview shows all records grouped by table type with anonymize vs delete label. Double-confirm before erasing.
- **API** (`GET/POST /api/admin/gdpr`): Financial records (Booking, ConcessionEntry, ConcessionReservation) are **anonymized** (`"ELIMINADO (RGPD)"`) — never deleted — to comply with Portuguese 7-year tax retention law. StaffRequest records are hard-deleted. Customer records anonymized + soft-deleted.
- **Sidebar**: "Apagar Dados (RGPD)" nav item added under Administração (SUPER_ADMIN only).
- **Consent notice**: Privacy policy link added to sign-in/sign-up page footers and to the public booking page (above pay button, all 5 languages).

#### Daily Database Backup (Free — via Resend)
- Vercel Cron job at `0 2 * * *` (02:00 UTC) calls `GET /api/cron/backup`.
- Route is read-only: queries all tables (Bookings, Customers, ConcessionEntries, ConcessionReservations, Partners, Services, StaffRequests) and emails a JSON attachment via Resend to `RESEND_TO_EMAIL`.
- Protected by `CRON_SECRET` header (set as Vercel env var).
- `vercel.json` added (force-added with `git add -f` — `.gitignore` contained `.vercel` pattern that was matching `vercel.json`).

#### Auth — Mobile Login Fix
- `overflow: hidden` on `.auth-root` was clipping the Clerk SignIn card vertically on small viewports (only logo and footer visible). Changed to `overflow-x: hidden` so horizontal glow stays clipped but vertical scroll is allowed.

#### Auth — Google OAuth on Production Clerk
- Production Clerk instance requires its own Google OAuth credentials (cannot reuse Development credentials).
- Created OAuth 2.0 client in Google Cloud Console → DNA CRM project. Added Client ID + Secret to Clerk Dashboard → SSO Connections → Google.
- **Note**: Google OAuth app must be **published** (not Testing mode) to allow all Google accounts to sign in. Testing mode restricts to explicit test users only.

---

### GCal / Meety Integration — Capacity Group Routing (2026-03-15)

#### Problem
`GcalStaff` rows were repeatedly lost (wiped during `prisma db push --force-reset` or `prisma migrate reset` in previous sessions). The table had no recovery mechanism and kept being re-entered manually.

#### GcalStaff Seed Endpoint
- `POST /api/admin/seed-gcal-staff` (SUPER_ADMIN only): reads `GCAL_STAFF_CONFIG` env var (JSON array), wipes existing rows, recreates them. One console command restores the full config after any DB reset.
- `GCAL_STAFF_CONFIG` stored in Vercel environment variables — **calendar IDs never in the git repo**.

#### capacityGroup-Based Calendar Routing
- Added `capacityGroup String?` field to `GcalStaff` schema.
- **Before**: GcalStaff was linked via `serviceId` (one row per physical unit per service variant). A Jetski with 5 variants needed 5 rows — and only blocked the calendar for exact variant matches.
- **After**: GcalStaff linked via `capacityGroup`. One row per physical unit covers all variants in the group automatically.
- `POST /api/bookings/create`: GcalStaff lookup now uses `capacityGroup` when set, falls back to `serviceId`.
- `GET /api/slots`: GcalStaff lookup for Google Calendar free/busy check also uses `capacityGroup`.
- Schedule page: "Serviço (opcional)" dropdown replaced with "Grupo Capacidade" text input.

#### Current Configuration
| Physical Unit | capacityGroup | Calendar |
|---|---|---|
| Jetski 1 | `JETSKI_RENTAL` | Jetski 1 Google Calendar |
| Jetski 2 | `JETSKI_RENTAL` | Jetski 2 Google Calendar |
| Jetski 3 | `JETSKI_RENTAL` | Jetski 3 Google Calendar |
| Insufláveis 4 | `INSUFLAVEIS` | Insufláveis 4 Google Calendar |

Services configuration (Horário → Configuração de Serviços):
| Service | capacityGroup | slotGapMinutes | gcalEnabled |
|---|---|---|---|
| Jetski Rental 10/15/30min | `JETSKI_RENTAL` | 0 | ON |
| Jetski Rental 20min | `JETSKI_RENTAL` | 10 | ON |
| Jetski Rental 60min | `JETSKI_RENTAL` | -30 | ON |
| Crazy Sofa | `INSUFLAVEIS` | 0 | ON |
| Banana Slider | `INSUFLAVEIS` | 0 | ON |

#### Buffer Logic (slotGapMinutes drives pre-buffer)
- `bufferMins = Math.max(0, slotGapMinutes)` — used as pre-booking buffer in both CRM and GCal availability checks.
- `slotGapMinutes = 10` → 10 min pre-buffer (Jetski 20min)
- `slotGapMinutes = 0` → no buffer (inflatables, Jetski 10/15/30min)
- `slotGapMinutes = -30` → no buffer, 30-min slot intervals (Jetski 60min)

#### How It Works End-to-End
```
Booking created in CRM (e.g. Jetski 30min @ 10:00, qty=1)
→ svc.capacityGroup = "JETSKI_RENTAL"
→ GcalStaff.findMany({ capacityGroup: "JETSKI_RENTAL" }) → [Jetski1, Jetski2, Jetski3]
→ filter out already-used calendars → assign Jetski1 (order=1)
→ createBusyEvent(Jetski1.calendarId, 10:00, 10:30, "CRM Booking - Name")
→ Google Calendar event created → Meety reads it → slot appears blocked
→ 2 remaining Jetski slots still available at 10:00

Booking created (Jetski 1hr @ 10:00, qty=1)
→ Jetski1 busy → assign Jetski2
→ 1 slot remaining at 10:00

@ 10:30 → Jetski1 event ends → 2 slots free again
```

#### Prerequisites for GCal to Work
1. `GOOGLE_SERVICE_ACCOUNT_JSON` env var set in Vercel (confirmed ✓)
2. Service account (`dna-crm-calendar@dna-crm-489518.iam.gserviceaccount.com`) has "Make changes to events" on all 4 Google Calendars (confirmed ✓)
3. Services have `gcalEnabled = ON` and correct `capacityGroup` in Horário (confirmed ✓)
4. GcalStaff rows populated via seed endpoint (confirmed ✓)

---

### Concessão Stripe Self-Service (2026-03-13)

- **Public booking page** (`/concessao/book/[slug]/[spotNumber]`): QR-accessible, no auth required. Two modes: **Hoje** (daily walk-in) and **Reserva** (multi-day).
- **Language selector**: 5 languages (PT/EN/ES/FR/DE) with flag emoji buttons, auto-detected from `navigator.language`.
- **Daily mode**: Period buttons (Morning/Afternoon/Full Day), extra bed toggle, name + phone, live price. Time-based cutoffs lock past periods. Fully-occupied state shows nearby available spots.
- **Reservation mode**: Date range picker, period + extra bed, 7-day discount applied automatically, refund policy note. Conflict → nearby spot suggestions shown.
- **Stripe Checkout**: `POST /api/concessions/checkout` (daily) and `POST /api/concessions/reservation-checkout` (multi-day). Billing address + NIF collection, Stripe Tax enabled.
- **Webhook**: `POST /api/webhooks/stripe` handles both `sessionType: "daily"` and `sessionType: "reservation"`. Idempotency via `stripeSessionId`. Race-condition guard auto-refunds if spot taken between checkout creation and webhook.
- **Staff requests**: Customer can call staff (cash payment) — creates `StaffRequest` → CRM bell badge shows count, auto-refreshes every 10s.
- **Statistics tab**: Added to concession detail page. KPIs (revenue paid/unpaid, occupancy, reservations, discounts), area chart by month, bar charts by day-of-week, walk-in vs reservation, bed config breakdown, top clients. Period selector (7d/30d/90d/1y/all/custom). Lazy-loaded with `next/dynamic`.
- **DailyControl**: Date navigation ← → arrows; export button fixed (DOM append before click); merged 3 API calls into single `/daily-summary` endpoint.
