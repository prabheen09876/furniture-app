import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

interface UIProductImage {
  id?: string;
  image_url: string;
  alt_text?: string;
}

/**
 * Improved image upload function that addresses 400 errors
 * This version includes better error handling and blob validation
 */
export const improvedHandleImageUpload = async (
  imageUri: string,
  setIsUploading: (loading: boolean) => void,
  images: UIProductImage[],
  setImages: (images: UIProductImage[]) => void
): Promise<UIProductImage> => {
  if (!imageUri) {
    throw new Error('No image URI provided');
  }
  
  console.log('🚀 Starting improved image upload...');
  console.log('📱 Platform:', Platform.OS);
  console.log('🖼️ Image URI:', imageUri);
  
  setIsUploading(true);
  
  try {
    // Step 1: Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    
    // Extract file extension properly
    let fileExt = 'jpg'; // default
    if (imageUri.startsWith('data:')) {
      const mimeMatch = imageUri.match(/data:([^;]+)/);
      if (mimeMatch) {
        const mimeType = mimeMatch[1];
        if (mimeType === 'image/png') fileExt = 'png';
        else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') fileExt = 'jpg';
        else if (mimeType === 'image/webp') fileExt = 'webp';
        else if (mimeType === 'image/gif') fileExt = 'gif';
      }
    } else {
      const urlExt = imageUri.split('.').pop()?.toLowerCase();
      if (urlExt && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(urlExt)) {
        fileExt = urlExt;
      }
    }
    
    const filename = `${timestamp}-${randomId}.${fileExt}`;
    const filePath = `product-images/${filename}`;
    
    console.log('📁 Target path:', filePath);
    
    // Step 2: Create blob with enhanced validation
    let blob: Blob;
    
    try {
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform - using fetch API');
        const response = await fetch(imageUri);
        
        if (!response.ok) {
          throw new Error(`Fetch failed with status: ${response.status}`);
        }
        
        blob = await response.blob();
        
      } else {
        console.log('📱 Mobile platform - using enhanced fetch approach');
        
        // For mobile, add additional headers and validation
        const response = await fetch(imageUri, {
          method: 'GET',
          headers: {
            'Accept': 'image/*',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Mobile fetch failed with status: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        
        if (arrayBuffer.byteLength === 0) {
          throw new Error('Image data is empty');
        }
        
        // Determine MIME type
        let mimeType = 'image/jpeg';
        const extension = imageUri.split('.').pop()?.toLowerCase();
        if (extension === 'png') mimeType = 'image/png';
        else if (extension === 'webp') mimeType = 'image/webp';
        else if (extension === 'gif') mimeType = 'image/gif';
        
        blob = new Blob([arrayBuffer], { type: mimeType });
      }
      
      // Enhanced blob validation
      if (!blob) {
        throw new Error('Blob creation failed - blob is null');
      }
      
      if (blob.size === 0) {
        throw new Error('Blob creation failed - blob is empty');
      }
      
      if (blob.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('Image is too large (max 50MB)');
      }
      
      console.log('✅ Blob created successfully:', {
        size: blob.size,
        type: blob.type,
        sizeInMB: (blob.size / (1024 * 1024)).toFixed(2),
        platform: Platform.OS
      });
      
    } catch (fetchError) {
      console.error('❌ Blob creation failed:', fetchError);
      throw new Error(`Failed to process image: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }
    
    // Step 3: Upload with enhanced error handling
    console.log('📤 Starting upload to Supabase...');
    
    const uploadOptions = {
      contentType: blob.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: false
    };
    
    console.log('📋 Upload options:', uploadOptions);
    
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, blob, uploadOptions);
    
    if (error) {
      console.error('❌ Storage upload error:', error);
      console.error('📋 Error details:', JSON.stringify(error, null, 2));
      
      // Enhanced error messages
      let errorMessage = 'Upload failed';
      
      if (error.message?.includes('Bucket not found')) {
        errorMessage = 'Storage bucket not found. Please run the storage setup SQL script first.';
      } else if (error.message?.includes('not allowed') || error.message?.includes('policy')) {
        errorMessage = 'Permission denied. Please check storage policies.';
      } else if (error.message?.includes('size') || error.message?.includes('too large')) {
        errorMessage = 'Image file is too large. Please select a smaller image.';
      } else if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        errorMessage = 'File already exists. Please try again.';
      } else if (error.message?.includes('network') || error.message?.includes('connection')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Upload timeout. Please try again.';
      } else {
        errorMessage = `Upload failed: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
    
    console.log('✅ Upload successful:', data);
    
    // Step 4: Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);
    
    if (!publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }
    
    console.log('🔗 Public URL generated:', publicUrl);
    
    // Step 5: Create image object
    const newImage: UIProductImage = {
      id: `temp-${timestamp}-${randomId}`,
      image_url: publicUrl,
      alt_text: `Product image ${images.length + 1}`
    };
    
    // Step 6: Update images array
    const updatedImages = [...images, newImage];
    setImages(updatedImages);
    
    console.log('🎉 Image upload completed successfully!');
    return newImage;
    
  } catch (error) {
    console.error('❌ Image upload failed:', error);
    throw error;
  } finally {
    setIsUploading(false);
  }
};

/**
 * Quick fix: Replace the existing handleImageUpload function in products.tsx
 * with this improved version to fix 400 errors
 */
export const getImprovedUploadFunctionCode = () => `
const handleImageUpload = async (imageUri: string): Promise<UIProductImage> => {
  if (!imageUri) {
    throw new Error('No image URI provided');
  }
  
  console.log('🚀 Starting improved image upload...');
  console.log('📱 Platform:', Platform.OS);
  console.log('🖼️ Image URI:', imageUri);
  
  setIsUploading(true);
  
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    
    // Extract file extension properly
    let fileExt = 'jpg';
    if (imageUri.startsWith('data:')) {
      const mimeMatch = imageUri.match(/data:([^;]+)/);
      if (mimeMatch) {
        const mimeType = mimeMatch[1];
        if (mimeType === 'image/png') fileExt = 'png';
        else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') fileExt = 'jpg';
        else if (mimeType === 'image/webp') fileExt = 'webp';
        else if (mimeType === 'image/gif') fileExt = 'gif';
      }
    } else {
      const urlExt = imageUri.split('.').pop()?.toLowerCase();
      if (urlExt && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(urlExt)) {
        fileExt = urlExt;
      }
    }
    
    const filename = \`\${timestamp}-\${randomId}.\${fileExt}\`;
    const filePath = \`product-images/\${filename}\`;
    
    console.log('📁 Target path:', filePath);
    
    // Create blob with enhanced validation
    let blob: Blob;
    
    try {
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform - using fetch API');
        const response = await fetch(imageUri);
        
        if (!response.ok) {
          throw new Error(\`Fetch failed with status: \${response.status}\`);
        }
        
        blob = await response.blob();
        
      } else {
        console.log('📱 Mobile platform - using enhanced fetch approach');
        
        const response = await fetch(imageUri, {
          method: 'GET',
          headers: {
            'Accept': 'image/*',
          },
        });
        
        if (!response.ok) {
          throw new Error(\`Mobile fetch failed with status: \${response.status}\`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        
        if (arrayBuffer.byteLength === 0) {
          throw new Error('Image data is empty');
        }
        
        // Determine MIME type
        let mimeType = 'image/jpeg';
        const extension = imageUri.split('.').pop()?.toLowerCase();
        if (extension === 'png') mimeType = 'image/png';
        else if (extension === 'webp') mimeType = 'image/webp';
        else if (extension === 'gif') mimeType = 'image/gif';
        
        blob = new Blob([arrayBuffer], { type: mimeType });
      }
      
      // Enhanced blob validation
      if (!blob || blob.size === 0) {
        throw new Error('Blob creation failed - blob is empty');
      }
      
      if (blob.size > 50 * 1024 * 1024) {
        throw new Error('Image is too large (max 50MB)');
      }
      
      console.log('✅ Blob created successfully:', {
        size: blob.size,
        type: blob.type,
        sizeInMB: (blob.size / (1024 * 1024)).toFixed(2),
        platform: Platform.OS
      });
      
    } catch (fetchError) {
      console.error('❌ Blob creation failed:', fetchError);
      throw new Error(\`Failed to process image: \${fetchError instanceof Error ? fetchError.message : String(fetchError)}\`);
    }
    
    // Upload with enhanced error handling
    console.log('📤 Starting upload to Supabase...');
    
    const uploadOptions = {
      contentType: blob.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: false
    };
    
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, blob, uploadOptions);
    
    if (error) {
      console.error('❌ Storage upload error:', error);
      
      let errorMessage = 'Upload failed';
      if (error.message?.includes('Bucket not found')) {
        errorMessage = 'Storage bucket not found. Please run the storage setup SQL script first.';
      } else if (error.message?.includes('not allowed') || error.message?.includes('policy')) {
        errorMessage = 'Permission denied. Please check storage policies.';
      } else if (error.message?.includes('size') || error.message?.includes('too large')) {
        errorMessage = 'Image file is too large. Please select a smaller image.';
      } else if (error.message?.includes('network') || error.message?.includes('connection')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = \`Upload failed: \${error.message}\`;
      }
      
      throw new Error(errorMessage);
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);
    
    if (!publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }
    
    const newImage: UIProductImage = {
      id: \`temp-\${timestamp}-\${randomId}\`,
      image_url: publicUrl,
      alt_text: \`Product image \${images.length + 1}\`
    };
    
    const updatedImages = [...images, newImage];
    setImages(updatedImages);
    
    console.log('🎉 Image upload completed successfully!');
    return newImage;
    
  } catch (error) {
    console.error('❌ Image upload failed:', error);
    throw error;
  } finally {
    setIsUploading(false);
  }
};
`;
