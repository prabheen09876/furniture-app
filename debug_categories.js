// Debug script to check categories in database
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCategories() {
  console.log('Checking categories in database...');
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*');
    
    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }
    
    console.log('Categories found:', data.length);
    data.forEach(category => {
      console.log(`- ${category.name} (${category.slug})`);
      console.log(`  icon_url: ${category.icon_url || 'null'}`);
      console.log(`  is_active: ${category.is_active}`);
      console.log('---');
    });
    
    // Check storage buckets
    console.log('\nChecking storage buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error fetching buckets:', bucketError);
      return;
    }
    
    console.log('Storage buckets:');
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name} (public: ${bucket.public})`);
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkCategories();
