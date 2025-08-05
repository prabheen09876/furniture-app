// Clean mobile upload function that works in APK builds
// Replace the handleImageUpload function in products.tsx with this

const handleImageUpload = async (imageUri: string): Promise<UIProductImage> => {
  if (!imageUri) {
    throw new Error('No image URI provided');
  }
  
  setIsUploading(true);
  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    
    // Extract file extension properly
    let fileExt = 'jpg'; // default
    if (imageUri.startsWith('data:')) {
      // Extract MIME type from data URL
      const mimeMatch = imageUri.match(/data:([^;]+)/);
      if (mimeMatch) {
        const mimeType = mimeMatch[1];
        if (mimeType === 'image/png') fileExt = 'png';
        else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') fileExt = 'jpg';
        else if (mimeType === 'image/webp') fileExt = 'webp';
        else if (mimeType === 'image/gif') fileExt = 'gif';
      }
    } else {
      // For regular URLs, try to extract extension
      const urlExt = imageUri.split('.').pop()?.toLowerCase();
      if (urlExt && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(urlExt)) {
        fileExt = urlExt;
      }
    }
    
    const filename = `${timestamp}-${randomId}.${fileExt}`;
    const filePath = `product-images/${filename}`;
    
    // Convert local image to blob for upload (APK-compatible approach)
    let blob: Blob;
    
    try {
      if (Platform.OS === 'web') {
        // Web platform - use fetch API
        if (imageUri.startsWith('data:')) {
          // Convert data URL to blob
          const response = await fetch(imageUri);
          blob = await response.blob();
        } else if (imageUri.startsWith('blob:') || imageUri.startsWith('http')) {
          // Web platform blob or HTTP URL
          const response = await fetch(imageUri);
          blob = await response.blob();
        } else {
          // For React Native Web file URIs
          const response = await fetch(imageUri);
          blob = await response.blob();
        }
      } else {
        // Mobile platform - use direct fetch approach (works in APK builds)
        console.log('Mobile platform detected, using fetch approach for:', imageUri);
        
        // Determine MIME type from file extension
        let mimeType = 'image/jpeg'; // default
        const extension = imageUri.split('.').pop()?.toLowerCase();
        if (extension === 'png') mimeType = 'image/png';
        else if (extension === 'webp') mimeType = 'image/webp';
        else if (extension === 'gif') mimeType = 'image/gif';
        
        console.log('Trying direct fetch approach...');
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`Fetch failed with status: ${response.status}`);
        }
        blob = await response.blob();
        console.log('Fetch successful, blob size:', blob.size);
        
        // Validate blob
        if (!blob || blob.size === 0) {
          throw new Error('Fetch returned invalid blob');
        }
      }
      
      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error('Invalid image data');
      }
      
      console.log('Blob created successfully:', {
        size: blob.size,
        type: blob.type,
        platform: Platform.OS
      });
      
    } catch (fetchError) {
      console.error('Failed to create blob from image URI:', fetchError);
      console.error('Platform:', Platform.OS, 'URI:', imageUri);
      throw new Error(`Failed to process the selected image on ${Platform.OS}. Please try a different image.`);
    }
    
    // Upload to Supabase Storage
    console.log('Attempting to upload to path:', filePath);
    console.log('Blob size:', blob.size, 'bytes');
    console.log('Blob type:', blob.type);
    
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Provide more specific error messages
      if (error.message?.includes('bucket')) {
        throw new Error('Storage bucket not found. Please run the storage setup SQL script first.');
      } else if (error.message?.includes('policy')) {
        throw new Error('Permission denied. Please check storage policies.');
      } else if (error.message?.includes('size')) {
        throw new Error('Image file is too large. Please select a smaller image.');
      } else {
        throw new Error(`Failed to upload image: ${error.message}`);
      }
    }
    
    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);
    
    if (!publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }
    
    const newImage: UIProductImage = {
      id: `temp-${timestamp}-${randomId}`, // Temporary ID for tracking
      image_url: publicUrl,
      alt_text: `Product image ${images.length + 1}`
    };
    
    // Update the images array
    const updatedImages = [...images, newImage];
    setImages(updatedImages);
    
    console.log('Image uploaded successfully:', newImage);
    return newImage;
    
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  } finally {
    setIsUploading(false);
  }
};
