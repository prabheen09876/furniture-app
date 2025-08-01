-- Verification script to check if banner setup was successful
-- Run this in Supabase SQL Editor after running setup_banner_storage.sql

-- 1. Check if banners table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'banners' AND table_schema = 'public';

-- 2. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'banners' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if storage bucket exists
SELECT name, id, public 
FROM storage.buckets 
WHERE name = 'banners';

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'banners';

-- 5. Check storage policies
SELECT name, bucket_id, definition
FROM storage.policies 
WHERE bucket_id = 'banners';

-- 6. Test basic insert (this should work if setup is correct)
-- Uncomment the lines below to test:
-- INSERT INTO public.banners (title, description, display_order) 
-- VALUES ('Test Banner', 'This is a test', 1);
-- 
-- SELECT * FROM public.banners WHERE title = 'Test Banner';
-- 
-- DELETE FROM public.banners WHERE title = 'Test Banner';
