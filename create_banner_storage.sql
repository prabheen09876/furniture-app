-- Quick fix: Create banner storage bucket
-- Run this in Supabase SQL Editor

-- 1. Create the banners storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for the banners bucket
CREATE POLICY "Public banner images are accessible by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can upload banner images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update banner images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'banners' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete banner images" ON storage.objects
  FOR DELETE USING (bucket_id = 'banners' AND auth.role() = 'authenticated');

-- 3. Verify the bucket was created
SELECT name, id, public, file_size_limit 
FROM storage.buckets 
WHERE name = 'banners';
