// Test script to update category with the existing uploaded image
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function updateCategoryIcon() {
  console.log('Updating nature category with existing uploaded image...');
  
  try {
    // The file we found in storage
    const publicUrl = 'https://khoxioouyornfttziire.supabase.co/storage/v1/object/public/category-icons/category-images/1753882967151-ove9q.data:image';
    
    const { data, error } = await supabase
      .from('categories')
      .update({ icon_url: publicUrl })
      .eq('slug', 'nature')
      .select();
    
    if (error) {
      console.error('Error updating category:', error);
      return;
    }
    
    console.log('Category updated successfully:', data);
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', 'nature');
    
    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      return;
    }
    
    console.log('Verification - Category after update:', verifyData[0]);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

updateCategoryIcon();
