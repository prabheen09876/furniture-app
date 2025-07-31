// Check what files exist in the category-icons storage bucket
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkStorage() {
  console.log('Checking category-icons storage bucket...');
  
  try {
    // List all files in the category-icons bucket
    const { data, error } = await supabase.storage
      .from('category-icons')
      .list('', {
        limit: 100,
        offset: 0
      });
    
    if (error) {
      console.error('Error listing files:', error);
      return;
    }
    
    console.log('Files in root:', data.length);
    data.forEach(file => {
      console.log(`- ${file.name} (${file.metadata?.size || 'unknown size'})`);
    });
    
    // Check category-images folder specifically
    console.log('\nChecking category-images folder...');
    const { data: folderData, error: folderError } = await supabase.storage
      .from('category-icons')
      .list('category-images', {
        limit: 100,
        offset: 0
      });
    
    if (folderError) {
      console.error('Error listing category-images folder:', folderError);
      return;
    }
    
    console.log('Files in category-images folder:', folderData.length);
    folderData.forEach(file => {
      console.log(`- ${file.name} (${file.metadata?.size || 'unknown size'})`);
      
      // Generate public URL for each file
      const { data: { publicUrl } } = supabase.storage
        .from('category-icons')
        .getPublicUrl(`category-images/${file.name}`);
      
      console.log(`  URL: ${publicUrl}`);
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkStorage();
