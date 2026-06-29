-- ============================================================
-- ADD SPANISH TRANSLATIONS (name_es) TO MEALS TABLE
-- Run this in your Supabase SQL Editor to apply database updates.
-- ============================================================

-- 1. Add name_es column if it does not exist
ALTER TABLE meals ADD COLUMN IF NOT EXISTS name_es TEXT;

-- 2. Populate Spanish translations for standard meals
UPDATE meals SET name_es = 'El Vegetariano' WHERE name = 'The Vegetarian';
UPDATE meals SET name_es = 'El Club de Yellowstone' WHERE name = 'The Yellowstone Club';
UPDATE meals SET name_es = 'Sándwich de Ensalada de Pollo' WHERE name = 'Chicken Salad Sandwich';
UPDATE meals SET name_es = 'Sándwich de Ensalada de Atún' WHERE name = 'Tuna Salad Sandwich';
UPDATE meals SET name_es = 'Ensalada de la Huerta' WHERE name = 'Garden Salad';
UPDATE meals SET name_es = 'El Madison' WHERE name = 'The Madison';
UPDATE meals SET name_es = 'El BLT' WHERE name = 'The BLT';
UPDATE meals SET name_es = 'El Oso Grizzly' WHERE name = 'The Grizzly Bear';
UPDATE meals SET name_es = 'Jamón y Queso' WHERE name = 'Ham and Cheese';
UPDATE meals SET name_es = 'Mantequilla de Maní y Mermelada de Arándanos' WHERE name = 'Peanut Butter and Huckleberry Jam';
UPDATE meals SET name_es = 'Ensalada de Pollo a la Parrilla' WHERE name = 'Grilled Chicken Salad';
UPDATE meals SET name_es = 'Pavo y Queso' WHERE name = 'Turkey and Cheese';
UPDATE meals SET name_es = 'Rosbif y Queso' WHERE name = 'Roastbeef and Cheese';
UPDATE meals SET name_es = 'Sándwich Caprese' WHERE name = 'Caprice Sandwich';
UPDATE meals SET name_es = 'Rosbif y Queso (Pan Francés)' WHERE name = 'Roastbeef and Cheese (French Bread)';
UPDATE meals SET name_es = 'Jamón y Queso (Pan Francés)' WHERE name = 'Ham and Cheese (French Bread)';
UPDATE meals SET name_es = 'Pavo y Queso (Pan Francés)' WHERE name = 'Turkey and Cheese (French Bread)';
UPDATE meals SET name_es = 'El Vegetariano (Pan Francés)' WHERE name = 'The Vegetarian (French Bread)';
UPDATE meals SET name_es = 'Ensalada de Rúcula y Arroz Salvaje' WHERE name = 'Arugula and wild rice salad';

-- 3. Populate Spanish translations for cookie options
UPDATE meals SET name_es = 'Chispas de Chocolate' WHERE name = 'Chocolate Chip';
UPDATE meals SET name_es = 'Galleta con Chispas de Chocolate' WHERE name = 'Chocolate Chip Cookie';
UPDATE meals SET name_es = 'Avena y Pasas' WHERE name = 'Oatmeal Raisin';
UPDATE meals SET name_es = 'Galleta de Avena y Pasas' WHERE name = 'Oatmeal Raisin Cookie';
UPDATE meals SET name_es = 'Azúcar' WHERE name = 'Sugar';
UPDATE meals SET name_es = 'Galleta de Azúcar' WHERE name = 'Sugar Cookie';
UPDATE meals SET name_es = 'Chispas de Chocolate Sin Gluten' WHERE name = 'Gluten-Free Chocolate Chip';
UPDATE meals SET name_es = 'Galleta con Chispas de Chocolate Sin Gluten' WHERE name = 'Gluten-Free Chocolate Chip Cookie';
