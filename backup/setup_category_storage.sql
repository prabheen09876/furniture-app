-- Storage Setup Script for Category Icons
-- Run this in your Supabase SQL Editor to create storage bucket and policies for category icons

-- 1. Create the storage bucket for category icons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-icons',
  'category-icons',
  true,
  10485760, -- 10MB limit (smaller than products since icons are smaller)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for the category-icons bucket

-- Policy 1: Allow public read access to all files in the category-icons bucket
CREATE POLICY "Public read access for category icons"
ON storage.objects
FOR SELECT
USING (bucket_id = 'category-icons');

-- Policy 2: Allow authenticated users to upload category icons
CREATE POLICY "Authenticated users can upload category icons"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'category-icons');

-- Policy 3: Allow authenticated users to update category icons
CREATE POLICY "Authenticated users can update category icons"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'category-icons')
WITH CHECK (bucket_id = 'category-icons');

-- Policy 4: Allow authenticated users to delete category icons
CREATE POLICY "Authenticated users can delete category icons"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'category-icons');

-- 3. Verify the bucket was created successfully
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'category-icons';

-- 4. Verify the policies were created
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%category%';

-- Success message
SELECT 'Storage bucket and policies created successfully for category icons!' as status;
