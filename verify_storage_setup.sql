-- Verification script to check if storage setup completed successfully
-- Run this AFTER running complete_storage_setup.sql

-- 1. Check if storage buckets exist
SELECT 
  'Storage Buckets Status:' as check_type,
  name,
  public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_types_count,
  created_at
FROM storage.buckets 
WHERE name IN ('products', 'category-icons', 'banners')
ORDER BY name;

-- 2. Check storage policies for products bucket
SELECT 
  'Storage Policies Status:' as check_type,
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname LIKE '%products%' THEN '✅ Products policy'
    WHEN policyname LIKE '%category%' THEN '✅ Category policy'
    WHEN policyname LIKE '%banners%' THEN '✅ Banners policy'
    ELSE '❓ Other policy'
  END as policy_type
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%products%' OR policyname LIKE '%category%' OR policyname LIKE '%banners%')
ORDER BY policyname;

-- 3. Check if product_images table exists
SELECT 
  'Product Images Table Status:' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'product_images'
ORDER BY ordinal_position;

-- 4. Check RLS policies on product_images table
SELECT 
  'Product Images RLS Status:' as check_type,
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Read access'
    WHEN cmd = 'INSERT' THEN '✅ Insert access'
    WHEN cmd = 'UPDATE' THEN '✅ Update access'
    WHEN cmd = 'DELETE' THEN '✅ Delete access'
    ELSE cmd
  END as access_type
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'product_images'
ORDER BY cmd;

-- 5. Summary check
SELECT 
  'Setup Summary:' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM storage.buckets WHERE name IN ('products', 'category-icons', 'banners')) = 3 
    THEN '✅ All 3 storage buckets exist'
    ELSE '❌ Missing storage buckets'
  END as buckets_status,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%products%') >= 4
    THEN '✅ Storage policies configured'
    ELSE '❌ Missing storage policies'
  END as policies_status,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_images') = 1
    THEN '✅ Product images table exists'
    ELSE '❌ Product images table missing'
  END as table_status;

-- If everything shows ✅, your storage setup is complete!
-- If you see ❌, run complete_storage_setup.sql again
