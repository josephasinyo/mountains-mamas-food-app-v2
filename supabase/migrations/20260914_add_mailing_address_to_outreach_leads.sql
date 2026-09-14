-- ============================================================
-- ADD MAILING ADDRESS COLUMN TO OUTREACH LEADS TABLE
-- Run this in Supabase SQL Editor to update the database schema
-- ============================================================

ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS mailing_address TEXT;
