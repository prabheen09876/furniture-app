-- Debug Banner Setup
-- Run this in Supabase SQL Editor to check current setup

-- 1. Check if banners table exists
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'banners';

-- 2. Check banners table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'banners' 
ORDER BY ordinal_position;

-- 3. Check RLS policies on banners table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'banners';

-- 4. Check if banners storage bucket exists
SELECT 
  name,
  id,
  public
FROM storage.buckets 
WHERE name = 'banners';

-- 5. Check storage policies for banners bucket
SELECT 
  name,
  bucket_id,
  definition
FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'banners');

-- 6. Test basic insert (will show specific error if any)
-- Uncomment the next line to test basic insert
-- INSERT INTO banners (title, description, image_url, is_active, display_order) 
-- VALUES ('Test Banner', 'Test Description', 'https://example.com/test.jpg', true, 1);

-- 7. Check current user authentication
SELECT 
  auth.uid() as user_id,
  auth.role() as user_role;

-- 8. Check if user has necessary permissions
SELECT 
  has_table_privilege('banners', 'INSERT') as can_insert,
  has_table_privilege('banners', 'SELECT') as can_select,
  has_table_privilege('banners', 'UPDATE') as can_update,
  has_table_privilege('banners', 'DELETE') as can_delete;
