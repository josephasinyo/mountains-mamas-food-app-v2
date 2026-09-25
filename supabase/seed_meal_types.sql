-- ====================================================================
-- Migration & Seed: Multi-Meal Types (Breakfast, Dinner, Charcuterie)
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/annrpkzwsghiwwkxqdxv/sql
-- ====================================================================

-- 1. Schema Migration
ALTER TABLE meals ADD COLUMN IF NOT EXISTS meal_type TEXT DEFAULT 'lunch';
UPDATE meals SET meal_type = 'lunch' WHERE meal_type IS NULL;

ALTER TABLE company_app_config ADD COLUMN IF NOT EXISTS allowed_meal_types TEXT[] DEFAULT ARRAY['lunch']::TEXT[];
UPDATE company_app_config SET allowed_meal_types = ARRAY['lunch']::TEXT[] WHERE allowed_meal_types IS NULL;

-- 2. Seed Breakfast Items
INSERT INTO meals (name, name_es, description, price, category, meal_type, is_active, sort_order, image_url)
VALUES 
(
    'Mountain Sunrise Breakfast Burrito',
    'Burrito de Desayuno Amanecer de Montaña',
    'Scrambled farm-fresh eggs, crispy bacon, cheddar-jack cheese, roasted breakfast potatoes, and house-made roasted salsa wrapped in a warm flour tortilla.',
    13.50,
    'breakfast',
    'breakfast',
    true,
    1,
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80'
),
(
    'Continental Pastry & Fresh Fruit Platter',
    'Plato Continental de Repostería y Fruta Fresca',
    'Fresh baked butter croissant, blueberry muffin, seasonal berries, sliced melon, Greek honey yogurt, and whipped butter.',
    12.00,
    'breakfast',
    'breakfast',
    true,
    2,
    'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80'
),
(
    'Granola & Greek Yogurt Parfait Bowl',
    'Tazón de Parfait de Yogur Griego y Granola',
    'Organic honey-toasted oats granola layered with creamy vanilla Greek yogurt, chia seeds, fresh strawberries, blueberries, and local huckleberry drizzle.',
    10.50,
    'breakfast',
    'breakfast',
    true,
    3,
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT DO NOTHING;

-- 3. Seed Dinner Items
INSERT INTO meals (name, name_es, description, price, category, meal_type, is_active, sort_order, image_url)
VALUES
(
    'Campfire Grilled Wild Salmon Plate',
    'Plato de Salmón Salvaje Asado al Fuego',
    'Wild-caught salmon filet grilled with lemon-herb butter, served alongside roasted Yukon gold potatoes and grilled asparagus spears.',
    26.00,
    'dinner',
    'dinner',
    true,
    1,
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80'
),
(
    'Montana Beef Tenderloin Medallions',
    'Medallones de Solomillo de Res de Montana',
    'Pan-seared tenderloin medallions with rosemary red wine reduction, garlic whipped potatoes, and butter-glazed baby carrots.',
    28.50,
    'dinner',
    'dinner',
    true,
    2,
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
),
(
    'Rustic Herb Roasted Chicken Plate',
    'Pollo Rústico Asado con Hierbas',
    'Slow-roasted herb-crusted half chicken served with wild rice pilaf, sweet roasted root vegetables, and natural pan jus.',
    22.00,
    'dinner',
    'dinner',
    true,
    3,
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT DO NOTHING;

-- 4. Seed Charcuterie Items
INSERT INTO meals (name, name_es, description, price, category, meal_type, is_active, sort_order, image_url)
VALUES
(
    'Yellowstone Artisan Charcuterie Board',
    'Tabla de Charcutería Artesanal de Yellowstone',
    'Prosciutto di Parma, Genoa salami, smoked gouda, sharp white cheddar, marinated olives, whole grain mustard, artisan crackers, and fresh grapes.',
    24.00,
    'charcuterie',
    'charcuterie',
    true,
    1,
    'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80'
),
(
    'Gourmet Cured Meats & Aged Cheeses Platter',
    'Plato Gourmet de Carnes Curadas y Quesos Añejos',
    'Hand-selected cured chorizo, capocollo, aged manchego, creamy brie, honeycomb, spiced candied pecans, dried apricots, and rosemary crostini.',
    29.50,
    'charcuterie',
    'charcuterie',
    true,
    2,
    'https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=800&q=80'
),
(
    'Bison Summer Sausage & Local White Cheddar',
    'Salchicha de Verano de Bisonte y Cheddar Blanco Local',
    'Local Montana bison summer sausage, aged Flathead cheddar, cornichons, spicy brown mustard, and sea salt crackers.',
    21.00,
    'charcuterie',
    'charcuterie',
    true,
    3,
    'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT DO NOTHING;

-- 5. Enable all meal types for existing partner companies to visualize the new sections
UPDATE company_app_config
SET allowed_meal_types = ARRAY['lunch', 'breakfast', 'dinner', 'charcuterie']::TEXT[];
