/*
  # Fix infinite recursion in admin_users RLS policies

  1. Problem
    - Current policies on admin_users table create infinite recursion
    - Policies check admin_users table to verify admin status, creating circular dependency
    
  2. Solution
    - Drop existing problematic policies
    - Create simpler policies that don't cause recursion
    - Allow users to view their own admin record
    - Use auth.uid() directly instead of querying admin_users table
    
  3. Security
    - Users can only see their own admin record
    - Super admin management will be handled at application level
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own admin record"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own admin record"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Note: INSERT and DELETE operations for admin_users should be handled
-- through a secure server-side process or by database administrators
-- to prevent unauthorized admin creation/deletion