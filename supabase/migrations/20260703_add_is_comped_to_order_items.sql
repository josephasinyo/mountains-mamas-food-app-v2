-- Migration to add is_comped to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_comped BOOLEAN NOT NULL DEFAULT false;
