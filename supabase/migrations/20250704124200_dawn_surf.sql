/*
  # Setup Admin User

  1. Create admin user with specified credentials
  2. Ensure admin dashboard access is properly configured
  3. Add admin user to admin_users table
*/

-- First, let's ensure we have a way to create the admin user
-- This will be handled through the application, but we need to prepare the admin_users table

-- Insert admin user record (this will be linked when the user signs up)
-- We'll use a known UUID for the admin user
DO $$
DECLARE
    admin_user_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Insert into admin_users table with the specific UUID
    INSERT INTO admin_users (id, role, permissions, is_active, created_at)
    VALUES (
        admin_user_id,
        'super_admin',
        ARRAY['products:read', 'products:write', 'orders:read', 'orders:write', 'users:read', 'users:write', 'categories:read', 'categories:write'],
        true,
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'super_admin',
        permissions = ARRAY['products:read', 'products:write', 'orders:read', 'orders:write', 'users:read', 'users:write', 'categories:read', 'categories:write'],
        is_active = true;
END $$;