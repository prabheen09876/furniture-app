-- Complete Storage Setup for Furniture Expo App
-- Run this in Supabase SQL Editor to fix all storage issues

-- 1. Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('products', 'products', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('category-icons', 'category-icons', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('banners', 'banners', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Create storage policies for products bucket
DROP POLICY IF EXISTS "Public read access for products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON storage.objects;

CREATE POLICY "Public read access for products"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can upload products"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete products"
ON storage.objects FOR DELETE
USING (bucket_id = 'products' AND auth.role() = 'authenticated');

-- 3. Create storage policies for category-icons bucket
DROP POLICY IF EXISTS "Public read access for category-icons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload category-icons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update category-icons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete category-icons" ON storage.objects;

CREATE POLICY "Public read access for category-icons"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-icons');

CREATE POLICY "Authenticated users can upload category-icons"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'category-icons' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update category-icons"
ON storage.objects FOR UPDATE
USING (bucket_id = 'category-icons' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'category-icons' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete category-icons"
ON storage.objects FOR DELETE
USING (bucket_id = 'category-icons' AND auth.role() = 'authenticated');

-- 4. Create storage policies for banners bucket
DROP POLICY IF EXISTS "Public read access for banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete banners" ON storage.objects;

CREATE POLICY "Public read access for banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can upload banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update banners"
ON storage.objects FOR UPDATE
USING (bucket_id = 'banners' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete banners"
ON storage.objects FOR DELETE
USING (bucket_id = 'banners' AND auth.role() = 'authenticated');

-- 5. Create product_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS on product_images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for product_images
DROP POLICY IF EXISTS "Public read access for product_images" ON public.product_images;
DROP POLICY IF EXISTS "Authenticated users can insert product_images" ON public.product_images;
DROP POLICY IF EXISTS "Authenticated users can update product_images" ON public.product_images;
DROP POLICY IF EXISTS "Authenticated users can delete product_images" ON public.product_images;

CREATE POLICY "Public read access for product_images"
ON public.product_images FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert product_images"
ON public.product_images FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product_images"
ON public.product_images FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product_images"
ON public.product_images FOR DELETE
USING (auth.role() = 'authenticated');

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON public.product_images(sort_order);

-- 9. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_product_images_updated_at ON public.product_images;
CREATE TRIGGER update_product_images_updated_at
    BEFORE UPDATE ON public.product_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Grant necessary permissions
GRANT ALL ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;

-- 11. Verification queries
SELECT 'Storage buckets created:' as status;
SELECT name, public, file_size_limit FROM storage.buckets WHERE name IN ('products', 'category-icons', 'banners');

SELECT 'Product images table created:' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'product_images'
ORDER BY ordinal_position;

SELECT 'Setup completed successfully!' as final_status;
