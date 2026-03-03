# Project Guidelines & Implementation Log

## Project Description
**Desportos Náuticos de Alvor CRM** is a centralized booking and management platform. It tracks online sales from Shopify, handles manual walk-in bookings, and provides a partner portal for external agencies to book directly into the system. All bookings are synchronized with a Google Calendar.

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
