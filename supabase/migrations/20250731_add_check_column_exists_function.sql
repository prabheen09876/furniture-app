-- Create a function to check if a column exists in a table
CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
RETURNS boolean AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users and anonymous users
GRANT EXECUTE ON FUNCTION check_column_exists(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_column_exists(text, text) TO anon;
