// Simple test to update existing category with icon URL
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testIconUpdate() {
  console.log('Testing icon URL update...');
  
  try {
    // Use a simple, reliable test image URL
    const testImageUrl = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=64&h=64&fit=crop&crop=center';
    
    console.log('Updating nature category with test image URL...');
    const { data, error } = await supabase
      .from('categories')
      .update({ icon_url: testImageUrl })
      .eq('slug', 'nature');
    
    if (error) {
      console.error('Error updating category:', error);
      return;
    }
    
    console.log('Update successful!');
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('categories')
      .select('name, slug, icon_url')
      .eq('slug', 'nature');
    
    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      return;
    }
    
    console.log('Verification result:', verifyData[0]);
    
    if (verifyData[0]?.icon_url) {
      console.log('✅ SUCCESS: Category now has an icon_url!');
      console.log('The category icon should now display in the app.');
    } else {
      console.log('❌ FAILED: Category still has no icon_url');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testIconUpdate();
