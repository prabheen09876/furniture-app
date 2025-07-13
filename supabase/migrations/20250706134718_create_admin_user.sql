-- Check if admin@example.com exists in auth.users
DO $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'admin@example.com';
  admin_password text := 'Admin@123'; -- Change this to a secure password in production
BEGIN
  -- Check if admin user exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    -- Create the admin user in auth.users
    RAISE NOTICE 'Creating admin user %', admin_email;
    
    -- Create auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', -- instance_id
      gen_random_uuid(),
      'authenticated', -- aud
      'authenticated', -- role
      admin_email,
      crypt(admin_password, gen_salt('bf')), -- Encrypt password
      now(), -- email_confirmed_at
      now(), -- recovery_sent_at
      now(), -- last_sign_in_at
      '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
      '{"email":"' || admin_email || '","email_verified":true,"full_name":"Admin User"}', -- raw_user_meta_data
      now(), -- created_at
      now(), -- updated_at
      '', -- confirmation_token
      '', -- email_change
      '', -- email_change_token_new
      '' -- recovery_token
    ) RETURNING id INTO admin_user_id;
    
    RAISE NOTICE 'Created admin user with ID: %', admin_user_id;
    
    -- Create profile for the admin user
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      created_at,
      updated_at
    ) VALUES (
      admin_user_id,
      admin_email,
      'Admin User',
      now(),
      now()
    );
    
    -- Grant admin privileges
    INSERT INTO public.admin_users (
      id,
      role,
      is_active,
      permissions,
      created_at,
      updated_at
    ) VALUES (
      admin_user_id,
      'super_admin',
      true,
      ARRAY['products:read', 'products:write', 'orders:read', 'orders:write', 'users:read', 'users:write', 'categories:read', 'categories:write'],
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'super_admin',
      is_active = true,
      permissions = ARRAY['products:read', 'products:write', 'orders:read', 'orders:write', 'users:read', 'users:write', 'categories:read', 'categories:write'],
      updated_at = now();
      
    RAISE NOTICE 'Admin privileges granted to user %', admin_user_id;
  ELSE
    RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
  END IF;
END $$;
