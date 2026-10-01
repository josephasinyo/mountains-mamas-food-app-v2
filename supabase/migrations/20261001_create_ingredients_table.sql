-- =========================================
-- Create Ingredients Table (Breads & Cookies)
-- =========================================

CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bread', 'cookie')),
    description TEXT,
    image_url TEXT,
    allergens TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for type and sort order
CREATE INDEX IF NOT EXISTS idx_ingredients_type ON ingredients(type);
CREATE INDEX IF NOT EXISTS idx_ingredients_sort_order ON ingredients(sort_order);

-- Auto-update updated_at trigger
CREATE TRIGGER update_ingredients_updated_at
    BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for ordering app & company menus)
CREATE POLICY "Ingredients are publicly readable" ON ingredients
    FOR SELECT USING (true);
