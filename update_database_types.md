# Update Database Types

After running the banner setup SQL script, you need to update your TypeScript types to include the new `banners` table.

## Method 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Generate Types**:
   ```bash
   supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
   ```

## Method 2: Manual Update

If you can't use the CLI, manually add the banner types to `lib/database.types.ts`:

```typescript
// Add this to your Tables interface in database.types.ts
banners: {
  Row: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    link_url: string | null;
    is_active: boolean;
    display_order: number;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    title: string;
    description?: string | null;
    image_url?: string | null;
    link_url?: string | null;
    is_active?: boolean;
    display_order?: number;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    title?: string;
    description?: string | null;
    image_url?: string | null;
    link_url?: string | null;
    is_active?: boolean;
    display_order?: number;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "banners_created_by_fkey";
      columns: ["created_by"];
      isOneToOne: false;
      referencedRelation: "users";
      referencedColumns: ["id"];
    }
  ];
};
```

## Method 3: Using Supabase Dashboard

1. **Go to Supabase Dashboard**
2. **Navigate to**: Settings → API
3. **Copy the TypeScript types** from the auto-generated section
4. **Replace** the contents of `lib/database.types.ts`

After updating types, restart your development server to pick up the changes.
