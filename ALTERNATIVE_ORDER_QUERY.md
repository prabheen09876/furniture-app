# Alternative Order Query Solutions

## Issue
The current order query is failing because of a missing foreign key relationship between `orders` and `profiles` tables:

```
Could not find a relationship between 'orders' and 'profiles' in the schema cache
```

## Quick Fix Options

### Option 1: Run the Database Fix (Recommended)
Execute `FIX_ORDERS_PROFILE_RELATIONSHIP.sql` in Supabase SQL Editor to establish proper foreign key relationships.

### Option 2: Alternative Query Approach (Immediate Fix)
If you need an immediate solution, modify your order fetching code to use separate queries:

```typescript
// Instead of this (which is failing):
const { data: order, error } = await supabase
  .from('orders')
  .select(`
    *,
    order_items(id, quantity, unit_price, total_price, products(name, image_url)),
    profiles!user_id(full_name, email, phone, avatar_url)
  `)
  .eq('id', orderId)
  .single();

// Use this approach:
const fetchOrderWithProfile = async (orderId: string) => {
  try {
    // First, get the order with order items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(id, quantity, unit_price, total_price, products(name, image_url))
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Order fetch error:', orderError);
      return { data: null, error: orderError };
    }

    // Then, get the user profile separately
    let profile = null;
    if (order.user_id) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, phone, avatar_url')
        .eq('id', order.user_id)
        .single();

      if (!profileError) {
        profile = profileData;
      } else {
        console.warn('Profile fetch error:', profileError);
        // Continue without profile data
      }
    }

    // Combine the data
    const orderWithProfile = {
      ...order,
      profile: profile
    };

    return { data: orderWithProfile, error: null };
  } catch (error) {
    console.error('Error fetching order with profile:', error);
    return { data: null, error };
  }
};
```

### Option 3: Use Manual Join (If foreign key exists but cache issue)
```typescript
// Alternative manual join approach
const { data: orders, error } = await supabase
  .from('orders')
  .select(`
    *,
    order_items(id, quantity, unit_price, total_price, products(name, image_url))
  `)
  .eq('id', orderId);

if (orders && orders.length > 0) {
  const order = orders[0];
  
  // Get profile manually
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone, avatar_url')
    .eq('id', order.user_id)
    .single();
    
  order.profile = profile;
}
```

### Option 4: Check Current Database Schema
First, verify what columns exist in your orders table:

```sql
-- Run this in Supabase SQL Editor to check current schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if foreign key exists
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'orders'
  AND tc.table_schema = 'public';
```

## Recommended Solution Steps

1. **Immediate Fix**: Use Option 2 (separate queries) to get your app working now
2. **Long-term Fix**: Run `FIX_ORDERS_PROFILE_RELATIONSHIP.sql` to establish proper relationships
3. **Verify**: Check that the foreign key relationship is working
4. **Revert**: Switch back to the original join query once the relationship is fixed

## Example Implementation for Orders Screen

```typescript
// In your orders screen component
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(true);

const fetchOrdersWithProfiles = async () => {
  try {
    setLoading(true);
    
    // Get orders with order items
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          quantity,
          unit_price,
          total_price,
          products(name, image_url)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Orders fetch error:', ordersError);
      return;
    }

    // Get profiles for each order (if needed)
    const ordersWithProfiles = await Promise.all(
      ordersData.map(async (order) => {
        if (order.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, phone, avatar_url')
            .eq('id', order.user_id)
            .single();
          
          return { ...order, profile };
        }
        return order;
      })
    );

    setOrders(ordersWithProfiles);
  } catch (error) {
    console.error('Error fetching orders:', error);
  } finally {
    setLoading(false);
  }
};
```

This approach will work immediately while you fix the database relationships.
