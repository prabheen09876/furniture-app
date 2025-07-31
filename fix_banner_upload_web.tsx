// Alternative Banner Upload Implementation for Web Platform
// Replace the pickImage and uploadImage functions in banners.tsx with these versions

import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

// Enhanced pickImage function that works better on web
const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [16, 9], // Banner aspect ratio
    quality: 0.8,
    base64: Platform.OS === 'web', // Get base64 on web for easier handling
  });

  if (!result.canceled && result.assets[0]) {
    setSelectedImage(result.assets[0].uri);
  }
};

// Alternative upload function that handles web platform better
const uploadImageWeb = async (imageUri: string): Promise<string> => {
  console.log('Starting web image upload...', imageUri);
  
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const fileName = `banner-${timestamp}-${randomId}.jpg`;
  const filePath = `banner-images/${fileName}`;

  console.log('Upload path:', filePath);

  try {
    let fileToUpload: File | Blob;

    if (Platform.OS === 'web') {
      // For web platform, handle the image differently
      if (imageUri.startsWith('data:')) {
        // Convert data URL to blob
        const response = await fetch(imageUri);
        fileToUpload = await response.blob();
      } else if (imageUri.startsWith('blob:')) {
        // Handle blob URL
        const response = await fetch(imageUri);
        fileToUpload = await response.blob();
      } else {
        // Try to create a file input and get the file
        throw new Error('Unsupported image format for web upload');
      }
    } else {
      // For mobile platforms
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      fileToUpload = await response.blob();
    }

    console.log('File prepared for upload. Size:', fileToUpload.size, 'bytes');
    
    // Validate file size
    if (fileToUpload.size === 0) {
      throw new Error('Selected image is empty or corrupted');
    }
    
    if (fileToUpload.size > 52428800) { // 50MB limit
      throw new Error('Image is too large. Please select an image smaller than 50MB.');
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('banners')
      .upload(filePath, fileToUpload, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      
      // Provide specific error messages
      if (error.message.includes('Bucket not found')) {
        throw new Error('Storage bucket not found. Please run the database setup script first.');
      } else if (error.message.includes('not allowed')) {
        throw new Error('Upload not allowed. Please check storage permissions.');
      } else if (error.message.includes('size')) {
        throw new Error('File is too large. Please select a smaller image.');
      }
      
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    console.log('Upload successful:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('banners')
      .getPublicUrl(filePath);

    console.log('Public URL generated:', publicUrl);
    return publicUrl;
    
  } catch (error: any) {
    console.error('Upload image error:', error);
    throw error;
  }
};

// Usage: Replace the existing uploadImage function call with uploadImageWeb
// Or modify the existing function to use this logic
