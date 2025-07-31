# Furniture App - Supabase Setup Instructions

This document provides step-by-step instructions for setting up the required Supabase resources for the Furniture App.

## 1. Database Migrations

Run the following SQL migrations in the Supabase SQL Editor in the order listed:

### 1.1 Create Categories Table (if not already created)

Run the migration in `migrations/20250727_create_categories_table.sql`

### 1.2 Add Check Column Exists Function

Run the migration in `migrations/20250731_add_check_column_exists_function.sql`

This creates a helper function to check if columns exist in tables, which is used by the app to handle schema changes gracefully.

### 1.3 Create Category Icons Storage Bucket

Run the migration in `migrations/20250730_create_category_icons_bucket.sql`

This creates:
- A storage bucket named 'category-icons'
- Public read access policies
- Authenticated write access policies
- Adds the icon_url column to the categories table if it doesn't exist
- Updates existing categories with default icon URLs

### 1.4 Add Transform Product Images Function (Optional)

If you want to use the server-side function for product image handling:

Run the migration in `migrations/20250726_add_transform_product_images_function.sql`

## 2. Upload Default Category Icons

After creating the storage bucket, upload default icons for categories:

1. Go to the Supabase Storage section
2. Open the 'category-icons' bucket
3. Create a 'defaults' folder
4. Upload icon images for each category with filenames matching the category slugs:
   - all.png
   - chairs.png
   - tables.png
   - sofas.png
   - beds.png
   - lamps.png
   - decor.png
   - storage.png

## 3. Update Project URL in Migration

In the `20250730_create_category_icons_bucket.sql` file, replace 'your-project-url' with your actual Supabase project URL before running the migration:

```sql
UPDATE categories SET icon_url = 'https://your-project-url.supabase.co/storage/v1/object/public/category-icons/defaults/all.png' WHERE slug = 'all' AND icon_url IS NULL;
```

## 4. Verify Setup

After completing the migrations:

1. Check that the 'category-icons' bucket exists in Storage
2. Verify that the categories table has the icon_url column
3. Confirm that the check_column_exists function is available
4. Test the app to ensure category icons are displayed correctly

## Troubleshooting

If you encounter issues:

- Check the Supabase logs for any SQL errors
- Verify that all migrations ran successfully
- Ensure the storage bucket policies are correctly configured
- Check that the category icons are uploaded to the correct location
- Verify that the project URL in the migration file is correct
