-- Migration: Add mailing_address column to tour_companies table
ALTER TABLE tour_companies ADD COLUMN IF NOT EXISTS mailing_address TEXT;
