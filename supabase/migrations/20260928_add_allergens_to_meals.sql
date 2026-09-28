-- Add allergens text array column to meals table
ALTER TABLE meals ADD COLUMN IF NOT EXISTS allergens text[] DEFAULT '{}';

-- Optional: GIN index for fast allergen querying if needed
CREATE INDEX IF NOT EXISTS idx_meals_allergens ON meals USING GIN (allergens);
