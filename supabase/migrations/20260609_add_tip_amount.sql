-- Add tip_amount tracking to invoices
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
