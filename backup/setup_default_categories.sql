-- Setup Default Categories for Furniture App
-- Run this in your Supabase SQL Editor after running setup_category_storage.sql

-- Insert default categories if they don't exist
INSERT INTO categories (id, name, slug, description, sort_order, is_active, icon_url)
VALUES 
  ('cat_chairs', 'Chairs', 'chairs', 'Comfortable seating solutions', 1, true, null),
  ('cat_tables', 'Tables', 'tables', 'Dining and coffee tables', 2, true, null),
  ('cat_sofas', 'Sofas', 'sofas', 'Comfortable sofas and couches', 3, true, null),
  ('cat_beds', 'Beds', 'beds', 'Bedroom furniture', 4, true, null),
  ('cat_lamps', 'Lamps', 'lamps', 'Lighting solutions', 5, true, null),
  ('cat_decor', 'Decor', 'decor', 'Home decorations', 6, true, null),
  ('cat_storage', 'Storage', 'storage', 'Storage solutions', 7, true, null),
  ('cat_outdoor', 'Outdoor', 'outdoor', 'Outdoor furniture', 8, true, null)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify the categories were created
SELECT id, name, slug, icon_url, is_active, sort_order 
FROM categories 
ORDER BY sort_order;
