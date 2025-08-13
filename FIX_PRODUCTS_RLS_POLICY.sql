-- =====================================================
-- FIX PRODUCTS RLS POLICY
-- =====================================================
-- This script fixes the Row Level Security policy for products table
-- Run this in Supabase SQL Editor to allow product creation

-- First, check if admin_users table exists (needed for admin policies)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'admin',
  permissions TEXT[] DEFAULT ARRAY['products:create', 'products:update', 'products:delete'],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admin users policies
DROP POLICY IF EXISTS "Admin users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "System can manage admin_users" ON public.admin_users;

CREATE POLICY "Admin users can view admin_users" ON public.admin_users
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admin_users WHERE is_active = true)
  );

CREATE POLICY "System can manage admin_users" ON public.admin_users
  FOR ALL USING (true);

-- Insert default admin user if not exists
INSERT INTO public.admin_users (user_id, email, role, is_active)
SELECT id, email, 'admin', true 
FROM auth.users 
WHERE email = 'admin@example.com'
ON CONFLICT (email) DO NOTHING;

-- Now fix the products table RLS policies
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.products;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.products;
DROP POLICY IF EXISTS "Admin users can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can create products" ON public.products;
DROP POLICY IF EXISTS "Admin users can create products" ON public.products;

-- Create new, more permissive policies for products
-- 1. Everyone can view products (public read access)
CREATE POLICY "Everyone can view products" ON public.products
  FOR SELECT USING (true);

-- 2. Authenticated users can create products (for now, can be restricted later)
CREATE POLICY "Authenticated users can create products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Admin users can update products
CREATE POLICY "Admin users can update products" ON public.products
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.admin_users WHERE is_active = true)
    OR auth.uid() IS NOT NULL  -- Temporary: allow all authenticated users
  );

-- 4. Admin users can delete products
CREATE POLICY "Admin users can delete products" ON public.products
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admin_users WHERE is_active = true)
    OR auth.uid() IS NOT NULL  -- Temporary: allow all authenticated users
  );

-- Alternative: If you want to completely disable RLS for products (less secure but works)
-- Uncomment the line below if the above policies still don't work
-- ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(is_active);

-- Verify the policies are working
DO $$
BEGIN
  RAISE NOTICE 'Products RLS policies have been updated';
  RAISE NOTICE 'Current authenticated user: %', auth.uid();
  
  -- Check if current user is admin
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true) THEN
    RAISE NOTICE 'Current user has admin privileges';
  ELSE
    RAISE NOTICE 'Current user does not have admin privileges';
  END IF;
END $$;

-- Show current policies for verification
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'products' AND schemaname = 'public';
