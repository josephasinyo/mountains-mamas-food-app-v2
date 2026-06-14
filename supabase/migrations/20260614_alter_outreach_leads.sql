-- ============================================================
-- ADD NEW COLUMNS TO OUTREACH LEADS TABLE
-- Run this in Supabase SQL Editor to update the database schema
-- ============================================================

-- 1. Create exec_sql helper function if it is missing
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE query;
END;
$$;

-- 2. Add new columns to outreach_leads
ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS outreach_tier TEXT;
ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS average_group_size INTEGER;
ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS estimated_annual_yellowstone_guests INTEGER;
