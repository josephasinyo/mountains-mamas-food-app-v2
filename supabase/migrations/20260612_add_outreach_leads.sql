-- =========================================
-- OUTREACH LEADS TABLE
-- For managing email campaign prospects
-- =========================================
CREATE TABLE IF NOT EXISTS outreach_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    website TEXT,
    home_base TEXT,
    state TEXT,
    primary_gate TEXT,
    tour_type TEXT,
    season TEXT,
    status TEXT NOT NULL DEFAULT 'not_contacted'
        CHECK (status IN ('not_contacted', 'emailed', 'responded', 'converted', 'rejected')),
    last_contacted_at TIMESTAMPTZ,
    follow_up_date DATE,
    notes TEXT,
    partnership_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for filtering and searching
CREATE INDEX IF NOT EXISTS idx_outreach_leads_status ON outreach_leads(status);
CREATE INDEX IF NOT EXISTS idx_outreach_leads_email ON outreach_leads(email);

-- Auto-update updated_at
CREATE TRIGGER update_outreach_leads_updated_at
    BEFORE UPDATE ON outreach_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (admin-only via service role key)
ALTER TABLE outreach_leads ENABLE ROW LEVEL SECURITY;
