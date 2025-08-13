-- =====================================================
-- IMMEDIATE PRODUCTS RLS FIX (TEMPORARY SOLUTION)
-- =====================================================
-- This is a quick fix to allow product creation immediately
-- Run this in Supabase SQL Editor for instant resolution

-- Option 1: Temporarily disable RLS on products table (QUICK FIX)
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, use these permissive policies
-- (Comment out the line above and uncomment the policies below)

/*
-- Drop all existing restrictive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.products;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.products;
DROP POLICY IF EXISTS "Admin users can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can create products" ON public.products;

-- Create very permissive policies (temporary)
CREATE POLICY "Allow all operations for authenticated users" ON public.products
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow public read access" ON public.products
  FOR SELECT USING (true);
*/

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'products' AND schemaname = 'public';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ IMMEDIATE FIX APPLIED: Products table RLS has been disabled';
  RAISE NOTICE '⚠️  SECURITY NOTE: Remember to re-enable RLS with proper policies later';
  RAISE NOTICE '📝 Next step: Run FIX_PRODUCTS_RLS_POLICY.sql for proper security setup';
END $$;
