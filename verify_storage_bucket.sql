-- Verify that banner storage bucket is properly set up
-- Run this in Supabase SQL Editor

-- 1. Check if banners bucket exists
SELECT name, id, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE name = 'banners';

-- 2. Check storage policies for banners bucket
SELECT policyname, cmd, permissive
FROM storage.policies 
WHERE bucket_id = 'banners';

-- 3. Test bucket accessibility (this should return the bucket info)
SELECT 
  'Bucket exists: ' || CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as bucket_status
FROM storage.buckets 
WHERE name = 'banners';
