-- Storage Setup Script for Product Images
-- Run this in your Supabase SQL Editor to create storage bucket and policies

-- 1. Create the storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for the products bucket

-- Policy 1: Allow public read access to all files in the products bucket
CREATE POLICY "Public read access for product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'products');

-- Policy 2: Allow authenticated users to upload files to product-images folder
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' 
  AND (storage.foldername(name))[1] = 'product-images'
);

-- Policy 3: Allow authenticated users to update their uploaded files
CREATE POLICY "Authenticated users can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'products')
WITH CHECK (
  bucket_id = 'products' 
  AND (storage.foldername(name))[1] = 'product-images'
);

-- Policy 4: Allow authenticated users to delete product images
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'products' 
  AND (storage.foldername(name))[1] = 'product-images'
);

-- 3. Verify the bucket was created successfully
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'products';

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
AND policyname LIKE '%product%';

-- Success message
SELECT 'Storage bucket and policies created successfully!' as status;
