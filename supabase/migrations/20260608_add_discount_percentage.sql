-- Add discount_percentage to tour_companies (default 0%)
ALTER TABLE tour_companies
  ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0;

-- Add discount tracking to invoices
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
