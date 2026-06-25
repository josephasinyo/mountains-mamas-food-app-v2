-- Create order_change_requests table
CREATE TABLE IF NOT EXISTS order_change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES tour_companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('update', 'delete')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    details JSONB DEFAULT '{}', -- For 'update', holds { customer_name, guide_name, tour_date, pickup_time, notes, items: [...] }
    status_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE order_change_requests ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at column
CREATE TRIGGER update_order_change_requests_updated_at
    BEFORE UPDATE ON order_change_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_order_change_requests_order_id ON order_change_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_order_change_requests_company_id ON order_change_requests(company_id);
