-- Migration: Add Service table and activityType/serviceId to Booking
-- Run with: npx wrangler d1 execute dna_crm_db --remote --file prisma/migrations/001_add_services.sql

CREATE TABLE IF NOT EXISTS "Service" (
    "id"            TEXT NOT NULL PRIMARY KEY,
    "shopifyHandle" TEXT,
    "name"          TEXT NOT NULL,
    "variant"       TEXT,
    "sku"           TEXT UNIQUE,
    "price"         REAL,
    "imageUrl"      TEXT,
    "category"      TEXT,
    "isActive"      INTEGER NOT NULL DEFAULT 1,
    "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Booking" ADD COLUMN "activityType" TEXT;
ALTER TABLE "Booking" ADD COLUMN "serviceId" TEXT;
