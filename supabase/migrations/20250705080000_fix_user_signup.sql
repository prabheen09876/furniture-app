-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the new user
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email,
    NOW(),
    NOW()
  );
  
  -- If this is the admin user, also add admin privileges
  IF NEW.email = 'admin@example.com' THEN
    INSERT INTO public.admin_users (
      id, 
      role, 
      is_active, 
      permissions,
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id,
      'super_admin',
      true,
      ARRAY['products:read', 'products:write', 'orders:read', 'orders:write', 'users:read', 'users:write', 'categories:read', 'categories:write'],
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'super_admin',
      is_active = true,
      permissions = ARRAY['products:read', 'products:write', 'orders:read', 'orders:write', 'users:read', 'users:write', 'categories:read', 'categories:write'],
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to be more permissive for the trigger function
DROP POLICY IF EXISTS "Enable insert for authenticated users on own profile" ON profiles;
CREATE POLICY "Enable insert for service role"
  ON profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Make sure the trigger function has the right permissions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Ensure the trigger function is secure
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
