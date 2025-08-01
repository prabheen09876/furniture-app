-- Test Storage Setup
-- Run this to check if storage bucket and policies are properly configured

-- 1. Check if the products bucket exists
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'products';

-- 2. Check storage policies
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

-- 3. Check if we can list objects in the bucket (should be empty initially)
SELECT 
  name,
  bucket_id,
  created_at
FROM storage.objects 
WHERE bucket_id = 'products'
LIMIT 5;

-- 4. Test bucket permissions
SELECT 
  bucket_id,
  name,
  id
FROM storage.objects 
WHERE bucket_id = 'products'
ORDER BY created_at DESC
LIMIT 1;
