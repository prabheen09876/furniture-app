# Order Items Database Fix

## Issue
Order creation fails with error:
```
Could not find the 'price' column of 'order_items' in the schema cache
```

## Root Cause
The `order_items` table is missing the `price` column that the checkout process is trying to insert.

## Solution

### Step 1: Run Database Migration
Go to your Supabase dashboard → SQL Editor and run the complete migration:

```sql
-- Copy and paste the contents of add_orders_columns.sql
-- This will fix both orders and order_items tables
```

**OR** run the standalone fix:

```sql
-- Copy and paste the contents of fix_order_items.sql
-- This will only fix the order_items table
```

### Step 2: Verify Database Schema
After running the migration, verify that the `order_items` table has these columns:
- `id` (UUID, primary key)
- `order_id` (UUID, foreign key to orders)
- `product_id` (UUID, foreign key to products)
- `quantity` (integer)
- `price` (decimal) ← **This was missing**
- `created_at` (timestamp)
- `updated_at` (timestamp) ← **This was also missing**

### Step 3: Test Order Creation
1. Add items to cart
2. Go to checkout
3. Fill in shipping details
4. Place order
5. Verify order appears in orders page and admin panel

## What the Migration Does

### For order_items table:
1. **Adds `price` column**: Stores the price of each item at time of purchase
2. **Adds `updated_at` column**: Tracks when order items are modified
3. **Creates trigger**: Automatically updates `updated_at` timestamp
4. **Sets permissions**: Allows authenticated users to access the table

### For orders table (if not already done):
1. **Adds `order_number`**: Unique order identifier for customers
2. **Adds `subtotal`**: Order subtotal amount
3. **Adds `tracking_number`**: For shipment tracking
4. **Adds `estimated_delivery`**: Expected delivery date
5. **Adds `updated_at`**: Order modification timestamp

## Files Modified
- `add_orders_columns.sql` - Complete migration script
- `fix_order_items.sql` - Standalone order_items fix
- `ORDER_ITEMS_FIX.md` - This troubleshooting guide

## Expected Behavior After Fix
✅ Orders can be placed successfully
✅ Order items are saved with correct prices
✅ Orders appear in user's order history
✅ Admin can view and manage orders
✅ No more "price column not found" errors

## Troubleshooting
If you still get errors after running the migration:
1. Check that the migration ran without errors in Supabase
2. Verify the columns exist in the `order_items` table
3. Check that RLS policies allow authenticated users to insert
4. Clear your app cache and restart the development server
