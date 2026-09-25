-- Migration: Add multi-meal types (breakfast, lunch, dinner, charcuterie)
-- Date: 2026-09-21

-- 1. Add meal_type to meals table
ALTER TABLE meals ADD COLUMN IF NOT EXISTS meal_type TEXT DEFAULT 'lunch';

-- Ensure all existing meals default to 'lunch'
UPDATE meals SET meal_type = 'lunch' WHERE meal_type IS NULL;

-- 2. Add allowed_meal_types to company_app_config
ALTER TABLE company_app_config ADD COLUMN IF NOT EXISTS allowed_meal_types TEXT[] DEFAULT ARRAY['lunch']::TEXT[];

-- Ensure all existing company configurations default to at least lunch
UPDATE company_app_config SET allowed_meal_types = ARRAY['lunch']::TEXT[] WHERE allowed_meal_types IS NULL;
