// Debug Banner Upload Issues
// Run this in browser console on the admin banners page to diagnose issues

console.log('=== Banner Upload Debug Script ===');

// 1. Check if we're running on web
console.log('Platform:', window.navigator.platform);
console.log('User Agent:', window.navigator.userAgent);

// 2. Check Supabase configuration
if (typeof supabase !== 'undefined') {
  console.log('✅ Supabase client is available');
  console.log('Supabase URL:', supabase.supabaseUrl);
} else {
  console.log('❌ Supabase client not found');
}

// 3. Test storage bucket access
async function testStorageAccess() {
  try {
    console.log('Testing storage bucket access...');
    
    // Try to list files in banners bucket
    const { data, error } = await supabase.storage
      .from('banners')
      .list('banner-images', {
        limit: 1
      });
    
    if (error) {
      console.log('❌ Storage bucket access failed:', error);
      
      if (error.message.includes('Bucket not found')) {
        console.log('💡 Solution: Run the fix_banner_upload.sql script in Supabase SQL Editor');
      }
    } else {
      console.log('✅ Storage bucket access successful:', data);
    }
  } catch (err) {
    console.log('❌ Storage test failed:', err);
  }
}

// 4. Test authentication
async function testAuth() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('❌ Authentication check failed:', error);
    } else if (user) {
      console.log('✅ User is authenticated:', user.email);
    } else {
      console.log('❌ User is not authenticated');
      console.log('💡 Solution: Please log in to upload banners');
    }
  } catch (err) {
    console.log('❌ Auth test failed:', err);
  }
}

// 5. Test blob creation from different URI types
function testBlobCreation() {
  console.log('Testing blob creation methods...');
  
  // Test data URL
  const testDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  fetch(testDataUrl)
    .then(response => response.blob())
    .then(blob => {
      console.log('✅ Data URL to blob conversion works:', blob.size, 'bytes');
    })
    .catch(err => {
      console.log('❌ Data URL to blob conversion failed:', err);
    });
}

// 6. Check CORS and network connectivity
async function testNetworkConnectivity() {
  try {
    console.log('Testing network connectivity to Supabase...');
    
    const response = await fetch(supabase.supabaseUrl + '/rest/v1/', {
      method: 'HEAD',
      headers: {
        'apikey': supabase.supabaseKey
      }
    });
    
    if (response.ok) {
      console.log('✅ Network connectivity to Supabase is working');
    } else {
      console.log('❌ Network connectivity issue:', response.status, response.statusText);
    }
  } catch (err) {
    console.log('❌ Network test failed:', err);
    console.log('💡 This might be a CORS or network connectivity issue');
  }
}

// Run all tests
console.log('Running diagnostic tests...');
testAuth();
testStorageAccess();
testBlobCreation();
testNetworkConnectivity();

console.log('=== Debug script complete ===');
console.log('💡 If you see errors above, please:');
console.log('1. Run fix_banner_upload.sql in Supabase SQL Editor');
console.log('2. Make sure you are logged in as an authenticated user');
console.log('3. Check your internet connection');
console.log('4. Try refreshing the page and testing again');
