/*
  # Admin User System Setup

  1. Purpose
    - Prepare the admin system for proper admin user management
    - The admin user (admin@example.com) will be created when they first sign up
    - This migration ensures the system is ready to handle admin users properly

  2. Changes
    - Update the handle_new_user function to properly handle admin promotion
    - Ensure admin_users table is ready for admin user creation
    - Add helper functions for admin management

  3. Security
    - Admin users are created through the authentication flow
    - Auto-promotion is based on email address matching
    - Proper RLS policies ensure secure access
*/

-- Create a function to check if an email should be auto-promoted to admin
CREATE OR REPLACE FUNCTION should_auto_promote_to_admin(user_email text)
RETURNS boolean AS $$
BEGIN
  -- Check if the email matches our admin email
  RETURN user_email = 'admin@example.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to promote a user to admin (to be called from application or triggers)
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_id uuid, admin_role text DEFAULT 'super_admin')
RETURNS void AS $$
BEGIN
  -- Insert or update the admin_users record
  INSERT INTO admin_users (id, role, permissions, is_active, created_at)
  VALUES (
    user_id,
    admin_role,
    ARRAY['products:read', 'products:write', 'orders:read', 'orders:write', 'users:read', 'users:write', 'categories:read', 'categories:write'],
    true,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = admin_role,
    permissions = ARRAY['products:read', 'products:write', 'orders:read', 'orders:write', 'users:read', 'users:write', 'categories:read', 'categories:write'],
    is_active = true,
    created_at = COALESCE(admin_users.created_at, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to auto-promote admin users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile for the new user
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  -- Check if this user should be auto-promoted to admin
  IF should_auto_promote_to_admin(NEW.email) THEN
    -- Promote to admin
    PERFORM promote_user_to_admin(NEW.id, 'super_admin');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add helpful comments
COMMENT ON FUNCTION should_auto_promote_to_admin(text) IS 'Checks if a user email should be automatically promoted to admin status';
COMMENT ON FUNCTION promote_user_to_admin(uuid, text) IS 'Promotes a user to admin status with specified role and permissions';
COMMENT ON FUNCTION handle_new_user() IS 'Handles new user creation, creates profile and auto-promotes admin users';

-- Note: The admin user will be created when admin@example.com signs up through the application
-- This approach ensures proper foreign key relationships and follows Supabase auth best practices