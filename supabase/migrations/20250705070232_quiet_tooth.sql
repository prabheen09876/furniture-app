/*
  # Fix RLS policies for user signup

  This migration fixes the Row Level Security policies that are preventing
  new users from being created successfully.

  ## Changes Made

  1. **Profiles Table**
     - Updated INSERT policy to allow authenticated users to create their own profile
     - Ensures the policy works correctly with Supabase's auth trigger

  2. **Admin Users Table** 
     - Added INSERT policy to allow the specific admin email to create admin records
     - This is for development/testing purposes only

  ## Security Notes
  
  The admin_users INSERT policy is intentionally restrictive and only allows
  the specific admin email. In production, admin role assignment should be
  done manually or via secure backend functions.
*/

-- First, let's drop existing problematic policies and recreate them properly

-- Drop existing profiles policies that might be conflicting
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile during signup" ON profiles;

-- Create a comprehensive INSERT policy for profiles that works with auth triggers
CREATE POLICY "Enable insert for authenticated users on own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure we have proper SELECT policy for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Enable select for users on own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Also ensure we have proper UPDATE policy for profiles  
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Enable update for users on own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- For admin_users table, we need to allow the admin email to insert records
-- This is for development purposes only
DROP POLICY IF EXISTS "Users can insert own admin record" ON admin_users;
CREATE POLICY "Enable insert for admin email"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id AND 
    auth.email() = 'admin@example.com'
  );

-- Ensure admin_users has proper SELECT policy
DROP POLICY IF EXISTS "Users can view own admin record" ON admin_users;
CREATE POLICY "Enable select for users on own admin record"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure admin_users has proper UPDATE policy
DROP POLICY IF EXISTS "Users can update own admin record" ON admin_users;
CREATE POLICY "Enable update for users on own admin record"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Make sure RLS is enabled on both tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;