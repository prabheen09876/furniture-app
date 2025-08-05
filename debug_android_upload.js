// Debug script specifically for Android upload issues
// Run this in React Native Debugger or device console

async function debugAndroidUpload() {
  console.log('🔍 Debugging Android image upload...');
  
  try {
    // Check platform
    console.log('Platform:', typeof Platform !== 'undefined' ? Platform.OS : 'unknown');
    
    // Check if required modules are available
    console.log('FileSystem available:', typeof FileSystem !== 'undefined');
    console.log('Supabase available:', typeof supabase !== 'undefined');
    
    // Test file URI that failed
    const testUri = 'file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540prabheen09876%252Facequint-app/ImagePicker/afdf26a9-5c00-4cbe-837c-3aa1f93f34f0.jpeg';
    
    console.log('Testing problematic URI:', testUri);
    
    // Test FileSystem access
    if (typeof FileSystem !== 'undefined') {
      try {
        console.log('Attempting FileSystem.getInfoAsync...');
        const fileInfo = await FileSystem.getInfoAsync(testUri);
        console.log('File info:', fileInfo);
        
        if (fileInfo.exists) {
          console.log('✅ File exists, size:', fileInfo.size);
          
          // Try reading as base64
          console.log('Attempting to read as base64...');
          const base64 = await FileSystem.readAsStringAsync(testUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          console.log('✅ Base64 read successful, length:', base64.length);
          
          // Test blob conversion
          const dataUrl = `data:image/jpeg;base64,${base64}`;
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          
          console.log('✅ Blob conversion successful:', {
            size: blob.size,
            type: blob.type
          });
          
        } else {
          console.error('❌ File does not exist at URI');
        }
        
      } catch (fsError) {
        console.error('❌ FileSystem operations failed:', fsError);
        
        // Try alternative approaches
        console.log('Trying fetch fallback...');
        try {
          const response = await fetch(testUri);
          console.log('Fetch response status:', response.status);
          
          if (response.ok) {
            const blob = await response.blob();
            console.log('✅ Fetch fallback successful:', {
              size: blob.size,
              type: blob.type
            });
          } else {
            console.error('❌ Fetch response not OK:', response.statusText);
          }
          
        } catch (fetchError) {
          console.error('❌ Fetch fallback also failed:', fetchError);
        }
      }
    } else {
      console.error('❌ FileSystem not available');
    }
    
    // Test permissions
    console.log('🔍 Checking permissions...');
    if (typeof ImagePicker !== 'undefined') {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('Media library permission status:', status);
      } catch (permError) {
        console.error('Permission check failed:', permError);
      }
    }
    
    // Test authentication
    console.log('🔍 Checking authentication...');
    if (typeof supabase !== 'undefined') {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Auth error:', error);
        } else if (!session) {
          console.error('❌ No active session');
        } else {
          console.log('✅ User authenticated:', session.user.email);
        }
      } catch (authError) {
        console.error('Auth check failed:', authError);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Instructions
console.log(`
📱 Android Upload Debug Instructions:
1. Enable React Native Debugger or use device console
2. Make sure you're in the app and signed in
3. Run this script to diagnose the specific issue
4. Check the detailed logs for the root cause

🔧 Common Android Issues:
- File permissions: App may not have access to the cache directory
- URI format: Android file URIs may need special handling
- Expo Go vs Standalone: Different behavior in development vs production
- FileSystem API: May have limitations in certain Android versions
`);

// Auto-run if environment is available
if (typeof FileSystem !== 'undefined' && typeof supabase !== 'undefined') {
  debugAndroidUpload();
} else {
  console.log('⏳ Required modules not available. Make sure you\'re in the app environment.');
}
