// Test direct blob creation from base64 (Android-compatible)
// Run this in React Native Debugger or device console

function testDirectBlobCreation() {
  console.log('🔍 Testing direct blob creation method...');
  
  try {
    // Create a small test base64 image (1x1 red pixel PNG)
    const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const mimeType = 'image/png';
    
    console.log('Test base64 length:', testBase64.length);
    
    // Method 1: Direct blob creation (new approach)
    console.log('Testing direct blob creation...');
    try {
      // Convert base64 to binary string
      const binaryString = atob(testBase64);
      console.log('Binary string length:', binaryString.length);
      
      // Convert binary string to Uint8Array
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create blob directly
      const directBlob = new Blob([bytes], { type: mimeType });
      console.log('✅ Direct blob creation successful:', {
        size: directBlob.size,
        type: directBlob.type
      });
      
    } catch (directError) {
      console.error('❌ Direct blob creation failed:', directError);
    }
    
    // Method 2: Data URL approach (old approach for comparison)
    console.log('Testing data URL approach...');
    try {
      const dataUrl = `data:${mimeType};base64,${testBase64}`;
      
      fetch(dataUrl)
        .then(response => response.blob())
        .then(dataUrlBlob => {
          console.log('✅ Data URL blob creation successful:', {
            size: dataUrlBlob.size,
            type: dataUrlBlob.type
          });
        })
        .catch(dataUrlError => {
          console.error('❌ Data URL blob creation failed:', dataUrlError);
          console.log('This is expected on Android - that\'s why we need the direct method');
        });
        
    } catch (dataUrlError) {
      console.error('❌ Data URL approach failed:', dataUrlError);
    }
    
    // Method 3: Test with FileSystem (if available)
    if (typeof FileSystem !== 'undefined') {
      console.log('Testing FileSystem + direct blob approach...');
      
      // This would be the full flow on mobile
      console.log('FileSystem is available - this is the mobile environment');
      console.log('In real usage, we would:');
      console.log('1. Read file with FileSystem.readAsStringAsync()');
      console.log('2. Get base64 data');
      console.log('3. Convert to blob using direct method (as tested above)');
      
    } else {
      console.log('FileSystem not available - this is likely web environment');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test different blob creation approaches
function compareBlobMethods() {
  console.log('📊 Comparing blob creation methods...');
  
  const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  // Test 1: Uint8Array approach
  try {
    const binaryString = atob(testBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob1 = new Blob([bytes], { type: 'image/png' });
    console.log('Method 1 (Uint8Array):', blob1.size, 'bytes');
  } catch (e) {
    console.log('Method 1 failed:', e.message);
  }
  
  // Test 2: ArrayBuffer approach
  try {
    const binaryString = atob(testBase64);
    const buffer = new ArrayBuffer(binaryString.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binaryString.length; i++) {
      view[i] = binaryString.charCodeAt(i);
    }
    const blob2 = new Blob([buffer], { type: 'image/png' });
    console.log('Method 2 (ArrayBuffer):', blob2.size, 'bytes');
  } catch (e) {
    console.log('Method 2 failed:', e.message);
  }
  
  // Test 3: Data URL approach
  fetch(`data:image/png;base64,${testBase64}`)
    .then(r => r.blob())
    .then(blob3 => {
      console.log('Method 3 (Data URL):', blob3.size, 'bytes');
    })
    .catch(e => {
      console.log('Method 3 failed:', e.message);
    });
}

console.log(`
🧪 Direct Blob Creation Test
This tests the new Android-compatible blob creation method.

The direct method converts base64 → binary string → Uint8Array → Blob
This avoids the fetch(dataUrl) call that fails on Android.
`);

// Run tests
testDirectBlobCreation();
compareBlobMethods();
