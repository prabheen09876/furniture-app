/*
  # Fix profiles table INSERT policy

  1. Security Changes
    - Add INSERT policy for profiles table to allow new user registration
    - This policy allows authenticated users to insert their own profile during signup
    - The policy uses auth.uid() to ensure users can only create profiles for themselves

  This resolves the "Database error saving new user" issue that occurs during user registration.
*/

-- Add INSERT policy for new user profiles
CREATE POLICY "Users can insert own profile during signup"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);