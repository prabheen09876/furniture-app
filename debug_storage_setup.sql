-- Debug script to check storage setup
-- Run this in Supabase SQL Editor to diagnose storage issues

-- 1. Check if storage buckets exist
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE name IN ('products', 'category-icons', 'banners');

-- 2. Check storage policies
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
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%products%';

-- 3. Check if product_images table exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'product_images'
ORDER BY ordinal_position;

-- 4. Check RLS policies on product_images
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'product_images';

-- 5. Check if specific buckets exist and their configuration
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'products') 
    THEN 'products bucket exists' 
    ELSE 'products bucket MISSING' 
  END as products_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'category-icons') 
    THEN 'category-icons bucket exists' 
    ELSE 'category-icons bucket MISSING' 
  END as category_icons_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'banners') 
    THEN 'banners bucket exists' 
    ELSE 'banners bucket MISSING' 
  END as banners_status;

-- 6. Check current user permissions
SELECT 
  current_user as current_user,
  session_user as session_user,
  current_setting('role') as current_role;
