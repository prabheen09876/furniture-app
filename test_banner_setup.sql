-- Quick Test: Banner Setup Verification
-- Run this in Supabase SQL Editor to verify everything is set up correctly

-- 1. Check if banners storage bucket exists
SELECT 
  'Storage Bucket Check' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'banners') 
    THEN '✅ PASS: Banners bucket exists' 
    ELSE '❌ FAIL: Banners bucket missing - run fix_banner_upload.sql'
  END as result;

-- 2. Check if banners table exists
SELECT 
  'Table Check' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'banners') 
    THEN '✅ PASS: Banners table exists' 
    ELSE '❌ FAIL: Banners table missing - run fix_banner_upload.sql'
  END as result;

-- 3. Check storage policies
SELECT 
  'Storage Policies Check' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'objects' 
      AND schemaname = 'storage' 
      AND policyname LIKE '%banner%'
    ) 
    THEN '✅ PASS: Storage policies exist' 
    ELSE '❌ FAIL: Storage policies missing - run fix_banner_upload.sql'
  END as result;

-- 4. Check table policies
SELECT 
  'Table Policies Check' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'banners' 
      AND schemaname = 'public'
    ) 
    THEN '✅ PASS: Table policies exist' 
    ELSE '❌ FAIL: Table policies missing - run fix_banner_upload.sql'
  END as result;

-- 5. Check current user authentication
SELECT 
  'Authentication Check' as test_name,
  CASE 
    WHEN auth.uid() IS NOT NULL 
    THEN '✅ PASS: User is authenticated - ' || auth.uid()::text
    ELSE '❌ FAIL: User not authenticated - please log in'
  END as result;

-- Summary
SELECT 
  '=== SETUP SUMMARY ===' as summary,
  CASE 
    WHEN (
      EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'banners') AND
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'banners') AND
      EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%banner%') AND
      EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'banners' AND schemaname = 'public') AND
      auth.uid() IS NOT NULL
    )
    THEN '🎉 ALL CHECKS PASSED - Banner upload should work!'
    ELSE '⚠️  SOME CHECKS FAILED - Please run fix_banner_upload.sql and ensure you are logged in'
  END as status;
