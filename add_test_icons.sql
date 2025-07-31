-- Add test icon URLs to categories for immediate testing
-- These use placeholder images to test the display logic

UPDATE categories 
SET icon_url = CASE 
  WHEN slug = 'chairs' THEN 'https://via.placeholder.com/64/8B7355/FFFFFF?text=🪑'
  WHEN slug = 'tables' THEN 'https://via.placeholder.com/64/8B7355/FFFFFF?text=🪵'
  WHEN slug = 'sofas' THEN 'https://via.placeholder.com/64/8B7355/FFFFFF?text=🛋️'
  WHEN slug = 'beds' THEN 'https://via.placeholder.com/64/8B7355/FFFFFF?text=🛏️'
  WHEN slug = 'lamps' THEN 'https://via.placeholder.com/64/8B7355/FFFFFF?text=💡'
  WHEN slug = 'decor' THEN 'https://via.placeholder.com/64/8B7355/FFFFFF?text=🖼️'
  WHEN slug = 'storage' THEN 'https://via.placeholder.com/64/8B7355/FFFFFF?text=🗄️'
  WHEN slug = 'outdoor' THEN 'https://via.placeholder.com/64/8B7355/FFFFFF?text=🌳'
  ELSE icon_url
END,
updated_at = NOW()
WHERE slug IN ('chairs', 'tables', 'sofas', 'beds', 'lamps', 'decor', 'storage', 'outdoor');

-- Verify the update
SELECT name, slug, icon_url FROM categories WHERE icon_url IS NOT NULL;
