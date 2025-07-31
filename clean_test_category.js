// Clean test script to update category with a proper test image URL
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function cleanAndTestCategory() {
  console.log('Cleaning up and testing category icon display...');
  
  try {
    // First, clean up the corrupted file
    console.log('Removing corrupted file...');
    const { error: removeError } = await supabase.storage
      .from('category-icons')
      .remove(['category-images/1753882967151-ove9q.data:image']);
    
    if (removeError) {
      console.warn('Error removing file (might not exist):', removeError.message);
    }
    
    // Update category with a test placeholder image URL
    const testImageUrl = 'https://via.placeholder.com/64/8B7355/FFFFFF?text=🌿';
    
    console.log('Updating nature category with test image URL...');
    const { data, error } = await supabase
      .from('categories')
      .update({ icon_url: testImageUrl })
      .eq('slug', 'nature')
      .select();
    
    if (error) {
      console.error('Error updating category:', error);
      return;
    }
    
    console.log('Category updated successfully!');
    console.log('Updated category:', data[0]);
    
    // Also add a few more test categories for better testing
    console.log('\nAdding more test categories...');
    const testCategories = [
      {
        name: 'Chairs',
        slug: 'chairs',
        description: 'Comfortable seating solutions',
        icon_url: 'https://via.placeholder.com/64/8B7355/FFFFFF?text=🪑',
        sort_order: 2,
        is_active: true
      },
      {
        name: 'Tables',
        slug: 'tables',
        description: 'Dining and coffee tables',
        icon_url: 'https://via.placeholder.com/64/8B7355/FFFFFF?text=🪵',
        sort_order: 3,
        is_active: true
      }
    ];
    
    for (const category of testCategories) {
      const { error: insertError } = await supabase
        .from('categories')
        .upsert(category, { onConflict: 'slug' });
      
      if (insertError) {
        console.warn(`Error adding ${category.name}:`, insertError.message);
      } else {
        console.log(`Added/updated ${category.name}`);
      }
    }
    
    // Verify all categories
    console.log('\nFinal verification - All categories:');
    const { data: allCategories, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    
    if (fetchError) {
      console.error('Error fetching categories:', fetchError);
      return;
    }
    
    allCategories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.slug}): ${cat.icon_url ? 'HAS ICON' : 'NO ICON'}`);
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

cleanAndTestCategory();
