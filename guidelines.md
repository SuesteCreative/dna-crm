# Project Guidelines & Implementation Log

## Project Description
**Desportos Náuticos de Alvor CRM** is a centralized booking and management platform. It tracks online sales from Shopify, handles manual walk-in bookings, and provides a partner portal for external agencies to book directly into the system. All bookings are synchronized with a Google Calendar.

> [!IMPORTANT]
> **MANDATORY RULE**: The editor MUST update this document (Implementation Log) for every medium and major implementation. This is required in every session.

## Technical Stack
- **Framework**: Next.js (App Router)
- **Deployment**: Cloudflare Pages
- **Database**: Cloudflare D1 (SQLite at the edge)
- **ORM**: Prisma (with Cloudflare D1 adapter)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Modern Aesthetics)
- **Auth**: NextAuth.js (configured for Edge)
- **External Integrations**: 
  - Shopify API (Orders, Products)
  - Google Calendar API
- **Export Formats**: Excel (.xlsx), PDF

## Repository Details
- **GitHub Repo**: `SuesteCreative/dna-crm`
- **Main Branch**: `main`

## Credentials & Keys (Placeholders)
> [!IMPORTANT]
> Actual keys should be stored in Cloudflare Environment Variables or `.env.local` (not committed). This section lists the *systems* requiring keys.

- **Shopify**: Access Token (Scopes: `read_customers`, `read_discounts`, `read_order_edits`, `read_orders`, `read_products`)
- **Google Calendar**: OAuth Client ID / Secret / Refresh Token
- **NextAuth**: `NEXTAUTH_SECRET`
- **Cloudflare**: API Tokens for D1 and Pages

---

## Implementation Log

### [2026-03-03] Initial Project Setup
- **Type**: Major
- **Description**: Initialized Next.js project with TypeScript and Vanilla CSS.
- **Details**: Created the base structure, configured `package.json`, `tsconfig.json`, and basic layout.
- **DB**: Initialized Prisma with SQLite (local development).

### [2026-03-03] Migration to Cloudflare Edge
- **Type**: Medium
- **Description**: Updated plan to use Cloudflare D1 and Edge runtime for Next.js.
- **Details**: Integrated implementation plan for GitHub and Cloudflare Pages.

### [2026-03-03] Git & Repository Setup
- **Type**: Medium
- **Description**: Initialized Git and linked to `SuesteCreative/dna-crm`.
- **Details**: Added remote origin, created `.gitignore`, and performed initial commit.

### [2026-03-03] Dependency Expansion
- **Type**: Minor
- **Description**: Added libraries for D1, Excel, and PDF exports.
- **Details**: Added `@prisma/adapter-d1`, `xlsx`, `jspdf`, and `wrangler`.

### [2026-03-03] Cloudflare Configuration
- **Type**: Minor
- **Description**: Created `wrangler.toml`.
- **Details**: Configured Pages build output and D1 database binding.

### [2026-03-03] Execution: Phase 1 Start
- **Type**: Major
- **Description**: Commenced implementation of core features.
- **Details**: Plan approved by user. Starting with NextAuth.js setup and database integration.

### [2026-03-03] Authentication System
- **Type**: Major
- **Description**: Configured NextAuth.js with Credentials Provider.
- **Details**: Created edge-compatible `auth.ts`, Prisma utility with D1 adapter, route handler, and seeded initial admin user.

### [2026-03-03] Shopify Integration (Initial)
- **Type**: Major
- **Description**: Created Shopify synchronization service.
- **Details**: Implemented `syncShopifyOrders` and a protected API route for manual sync.

### [2026-03-03] Dashboard & UI
- **Type**: Major
- **Description**: Implemented premium dashboard UI.
- **Details**: Added stats cards, bookings table, and ocean-themed aesthetics with Vanilla CSS. Created `api/bookings` route.

### [2026-03-03] Shopify & Sync Refinement
- **Type**: Medium
- **Description**: Refined Shopify sync logic.
- **Details**: Added logic to extract activity date, time, and pax from line item properties.

### [2026-03-03] Manual Bookings
- **Type**: Major
- **Description**: Implemented manual booking system.
- **Details**: Created `api/bookings/create` and added a modal form to the dashboard.

### [2026-03-03] Partner Management
- **Type**: Major
- **Description**: Implemented partner management interface.
- **Details**: Created `partners/page.tsx` and APIs for listing and creating partners.

### [2026-03-03] Exports & Reports
- **Type**: Major
- **Description**: Implemented Excel and PDF exports.
- **Details**: Created `lib/export.ts` using `xlsx` and `jspdf`. Added buttons to the dashboard.

### [2026-03-04] Deployment & Compatibility Refinement
- **Type**: Major
- **Description**: Configured project for production environment on Cloudflare Pages.
- **Details**: Updated `wrangler.toml` with final D1 `database_id`, set `compatibility_flags = ["nodejs_compat"]`, and updated build output directory to `.vercel/output/static`.
- **System**: Added `system` user to `seed.js`.
- **Compat**: Updated `next.config.mjs` with webpack shims for node built-ins and added `runtime = "edge"` to NextAuth route.

### [2026-03-04] Migration: Switching to Clerk Authentication — "Premium Upgrade" ✅
- **Type**: Major refactor
- **Description**: Replaced NextAuth with Clerk for a more professional, reliable, and premium experience.
- **Why change?**: NextAuth had complex Node.js dependency issues on Cloudflare and required manual password management. Clerk is natively compatible with Cloudflare and provides a high-quality, pre-built UI and secure account handling.
- **Key Actions taken**:
  - Removed all `next-auth` files and middleware.
  - Installed `@clerk/nextjs`.
  - Wrapped `layout.tsx` in `ClerkProvider`.
  - Replaced middleware with `clerkMiddleware`.
  - Updated `wrangler.toml` with `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- **Environment Variables in Cloudflare Dashboard**:
  - `CLERK_SECRET_KEY` (Secret): set
  - `SHOPIFY_ACCESS_TOKEN` (Secret): set
  - `SHOPIFY_STORE_DOMAIN` (Plaintext): `3af112.myshopify.com`
- **D1 Binding**: `DB` → `dna_crm_db`
- **Commit**: `ef2c1a0` (implied) — Migrated to Clerk

### [2026-03-04] Production Deployment — LIVE with OpenNext ✅
- **Type**: Major
- **Description**: Successfully deployed to Cloudflare Pages using `@opennextjs/cloudflare`.
- **Root Cause of previous failures**: The old `@cloudflare/next-on-pages` adapter is deprecated and incompatible with NextAuth v4 (requires Node.js). It forced Edge Runtime on all routes, blocking `crypto`, `util`, `querystring` etc.
- **Fix**: Migrated to `@opennextjs/cloudflare` (Cloudflare's official recommended adapter). Supports Node.js runtime natively — no Webpack hacks needed.
- **Final Cloudflare Build Settings**:
  - **Build command**: `npx @opennextjs/cloudflare@latest build --dangerouslyUseUnsupportedNextVersion && cp .open-next/worker.js .open-next/_worker.js`
  - **Build output directory**: `.open-next`
  - **Compatibility flags (Runtime)**: `nodejs_compat`
  - **Framework preset**: None
- **Files added/changed**:
  - `wrangler.toml`: `pages_build_output_dir = ".open-next"`
  - `next.config.mjs`: Minimal clean config (no Webpack hacks)
  - `open-next.config.ts`: Required by OpenNext
  - `.npmrc`: `legacy-peer-deps=true` (for Next.js 14 + OpenNext compatibility)
  - `prisma/seed.js`: Fixed admin email to `booking@desportosnauticosalvor.com`
  - Removed all `export const runtime = "edge"` from all API routes
- **Database**: Tables `User`, `Partner`, `Booking` confirmed live via `wrangler d1 execute --remote`.
- **Admin user**: `booking@desportosnauticosalvor.com` (role: ADMIN)
- **Environment Variables in Cloudflare**:
  - `NEXTAUTH_URL` (Plaintext): `https://dna-crm.pages.dev`
  - `NEXTAUTH_SECRET` (Secret): set
  - `SHOPIFY_ACCESS_TOKEN` (Secret): set
  - `SHOPIFY_STORE_DOMAIN` (Plaintext): `3af112.myshopify.com`
- **D1 Binding**: `DB` → `dna_crm_db`
- **Commit**: `85a74a0` — deployed 2026-03-04
