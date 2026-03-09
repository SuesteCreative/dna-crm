# DNA CRM — Changelog & Architecture Reference

> **Purpose:** Complete reference for any developer or AI agent continuing work on this codebase. Read this before making changes.

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
| Email | `resend` | Bug reports only |
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

**Service**
- `id`, `shopifyHandle`, `name`, `variant`, `sku` (unique), `price`, `imageUrl`, `category`, `isActive`
- `durationMinutes`, `unitCapacity`, `capacityGroup`, `slotGapMinutes`
- `serviceCloseTime` — per-service close time override (e.g. `"17:40"`)
- `gcalEnabled` (Boolean) — whether to sync to Google Calendar
- `minPax`, `maxPax` — for pax-priced services (sofa/banana)

**Schedule**
- `id`, `dayOfWeek` (0=Sun…6=Sat, unique), `openTime`, `closeTime`, `isOpen`

**GcalStaff**
- `id`, `name`, `calendarId`, `serviceId?`, `order`
- Maps staff/resource to a Google Calendar

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
| `7f9d5ea` | exceljs styled export (colour-coded rows, section headers, bold totals), legend redesign, carry-over hides EXTRA_BED option, spacing between grid and note area |
| `07-03-26` | Visual Improvements: Loading Skeletons (V1), Toast Notifications (V2), Concession Themes (V4: Trópico orange, Subnauta blue), Print-Optimized CSS (V5) |


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
