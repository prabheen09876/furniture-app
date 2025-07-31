-- Step 1: Create a function to check if a column exists
CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
RETURNS boolean AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_column_exists(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_column_exists(text, text) TO anon;

-- Step 2: Create the storage bucket for category icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-icons', 'category-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Set up storage policies for the category-icons bucket
-- Allow public read access to category icons
CREATE POLICY "Category icons are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'category-icons');

-- Allow authenticated users to upload category icons
CREATE POLICY "Authenticated users can upload category icons" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'category-icons' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own category icons
CREATE POLICY "Authenticated users can update category icons" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'category-icons' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete category icons
CREATE POLICY "Authenticated users can delete category icons" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'category-icons' AND
  auth.role() = 'authenticated'
);

-- Step 4: Modify the categories table to add icon_url field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'categories'
      AND column_name = 'icon_url'
  ) THEN
    ALTER TABLE categories ADD COLUMN icon_url TEXT;
  END IF;
END
$$;

-- Step 5: Update existing categories with default icon URLs
-- Note: Replace 'your-project-url' with your actual Supabase project URL
-- You'll need to upload these default icons to the category-icons/defaults/ folder
UPDATE categories SET icon_url = 'https://your-project-url.supabase.co/storage/v1/object/public/category-icons/defaults/all.png' WHERE slug = 'all' AND icon_url IS NULL;
UPDATE categories SET icon_url = 'https://your-project-url.supabase.co/storage/v1/object/public/category-icons/defaults/chairs.png' WHERE slug = 'chairs' AND icon_url IS NULL;
UPDATE categories SET icon_url = 'https://your-project-url.supabase.co/storage/v1/object/public/category-icons/defaults/tables.png' WHERE slug = 'tables' AND icon_url IS NULL;
UPDATE categories SET icon_url = 'https://your-project-url.supabase.co/storage/v1/object/public/category-icons/defaults/sofas.png' WHERE slug = 'sofas' AND icon_url IS NULL;
UPDATE categories SET icon_url = 'https://your-project-url.supabase.co/storage/v1/object/public/category-icons/defaults/beds.png' WHERE slug = 'beds' AND icon_url IS NULL;
UPDATE categories SET icon_url = 'https://your-project-url.supabase.co/storage/v1/object/public/category-icons/defaults/lamps.png' WHERE slug = 'lamps' AND icon_url IS NULL;
UPDATE categories SET icon_url = 'https://your-project-url.supabase.co/storage/v1/object/public/category-icons/defaults/decor.png' WHERE slug = 'decor' AND icon_url IS NULL;
UPDATE categories SET icon_url = 'https://your-project-url.supabase.co/storage/v1/object/public/category-icons/defaults/storage.png' WHERE slug = 'storage' AND icon_url IS NULL;
