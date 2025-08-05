import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';

export interface ImageUploadOptions {
  bucket: string;
  folder: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  aspectRatio?: [number, number];
}

export interface ImageUploadResult {
  publicUrl: string;
  filePath: string;
  width?: number;
  height?: number;
}

/**
 * Improved image upload utility with better Android support
 */
export class ImageUploadService {
  
  /**
   * Pick and upload an image with optimized Android handling
   */
  static async pickAndUploadImage(options: ImageUploadOptions): Promise<ImageUploadResult | null> {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
        return null;
      }

      // Launch image picker with optimized settings
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: options.aspectRatio || [4, 3],
        quality: options.quality || 0.8,
        allowsMultipleSelection: false,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const asset = result.assets[0];
      console.log('Image picker result:', {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType,
        platform: Platform.OS
      });

      return await this.uploadImageFromUri(asset.uri, options, {
        originalWidth: asset.width,
        originalHeight: asset.height,
        mimeType: asset.mimeType,
      });

    } catch (error) {
      console.error('Error in pickAndUploadImage:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      return null;
    }
  }

  /**
   * Upload image from URI with multiple fallback strategies for Android
   */
  static async uploadImageFromUri(
    imageUri: string, 
    options: ImageUploadOptions,
    metadata?: {
      originalWidth?: number;
      originalHeight?: number;
      mimeType?: string;
    }
  ): Promise<ImageUploadResult> {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    
    // Determine file extension
    let fileExt = 'jpg';
    if (metadata?.mimeType) {
      const mimeMap: { [key: string]: string } = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg', 
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif'
      };
      fileExt = mimeMap[metadata.mimeType] || 'jpg';
    }

    const filename = `${timestamp}-${randomId}.${fileExt}`;
    const filePath = `${options.folder}/${filename}`;

    console.log('Starting upload process:', {
      originalUri: imageUri,
      targetPath: filePath,
      platform: Platform.OS,
      bucket: options.bucket
    });

    try {
      let blob: Blob;
      let processedWidth: number | undefined;
      let processedHeight: number | undefined;

      if (Platform.OS === 'web') {
        // Web platform - simple fetch approach
        console.log('Web platform: Using fetch approach');
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        blob = await response.blob();
      } else {
        // Mobile platform - use enhanced processing for Android compatibility
        console.log('Mobile platform: Using enhanced processing');
        
        // For Android, we'll use a different approach
        if (Platform.OS === 'android') {
          console.log('Android platform: Using direct base64 approach');
          
          try {
            // First verify the file exists
            const fileInfo = await FileSystem.getInfoAsync(imageUri);
            if (!fileInfo.exists) {
              throw new Error('File does not exist at the specified URI');
            }
            
            // Read the file directly as base64
            const base64Data = await FileSystem.readAsStringAsync(imageUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            if (!base64Data || base64Data.length === 0) {
              throw new Error('Failed to read file as base64');
            }
            
            console.log('Android: Successfully read file as base64, length:', base64Data.length);
            
            // Upload to Supabase using base64 approach
            const uploadResult = await this.uploadToSupabase(options.bucket, filePath, base64Data, metadata?.mimeType);
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from(options.bucket)
              .getPublicUrl(filePath);
            
            console.log('Android: Upload completed successfully using base64 approach:', {
              filePath,
              publicUrl,
              uploadPath: uploadResult?.path
            });
            
            return {
              publicUrl,
              filePath,
              width: metadata?.originalWidth,
              height: metadata?.originalHeight,
            };
          } catch (androidError) {
            console.error('Android direct base64 approach failed:', androidError);
            // Fall through to the blob approach as a fallback
          }
        }
        
        // For iOS or Android fallback
        const processResult = await this.processImageForMobile(imageUri, {
          maxWidth: options.maxWidth || 2048,
          maxHeight: options.maxHeight || 2048,
          quality: options.quality || 0.8,
          format: SaveFormat.JPEG, // Always use JPEG for better compatibility
        });

        blob = processResult.blob;
        processedWidth = processResult.width;
        processedHeight = processResult.height;
      }

      // Validate blob
      this.validateBlob(blob);

      console.log('Blob prepared for upload:', {
        size: blob.size,
        type: blob.type,
        sizeInMB: (blob.size / (1024 * 1024)).toFixed(2)
      });

      // Upload to Supabase Storage
      const uploadResult = await this.uploadToSupabase(options.bucket, filePath, blob);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(filePath);

      console.log('Upload completed successfully:', {
        filePath,
        publicUrl,
        uploadPath: uploadResult?.path || filePath
      });

      return {
        publicUrl,
        filePath,
        width: processedWidth,
        height: processedHeight,
      };

    } catch (error) {
      console.error('Upload failed:', error);
      throw this.createUserFriendlyError(error);
    }
  }

  /**
   * Process image for mobile platforms with multiple fallback strategies
   */
  private static async processImageForMobile(
    imageUri: string,
    options: {
      maxWidth: number;
      maxHeight: number;
      quality: number;
      format: SaveFormat;
    }
  ): Promise<{ blob: Blob; width?: number; height?: number }> {
    
    // Special handling for Android platform
    if (Platform.OS === 'android') {
      try {
        console.log('Android platform detected, using expo-file-system for direct base64 upload');
        
        // Get file info first to validate the file exists
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) {
          throw new Error('File does not exist at the specified URI');
        }
        
        console.log('Android file info:', fileInfo);
        
        // Read the file as base64 using expo-file-system - most reliable for Android
        const base64Data = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        if (!base64Data || base64Data.length === 0) {
          throw new Error('Failed to read file as base64');
        }
        
        console.log('Android base64 read successful, length:', base64Data.length);
        
        // Clean the base64 data (remove any potential data URL prefix)
        const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
        
        // Create a blob from the base64 data
        const response = await fetch(`data:image/jpeg;base64,${cleanBase64}`);
        const blob = await response.blob();
        
        console.log('Android blob created successfully, size:', blob.size);
        return { blob };
      } catch (androidError) {
        console.error('Android-specific approach failed:', androidError);
      }
    }
    
    // Strategy 1 (non-Android): Try expo-image-manipulator (best quality)
    try {
      console.log('Attempting image manipulation...');
      
      const manipulatedResult = await manipulateAsync(
        imageUri,
        [
          { resize: { width: options.maxWidth, height: options.maxHeight } }
        ],
        {
          compress: options.quality,
          format: options.format,
          base64: true,
        }
      );

      if (manipulatedResult.base64) {
        console.log('Image manipulation successful:', {
          width: manipulatedResult.width,
          height: manipulatedResult.height,
          base64Length: manipulatedResult.base64.length
        });

        const blob = this.base64ToBlob(manipulatedResult.base64, 'image/jpeg');
        return {
          blob,
          width: manipulatedResult.width,
          height: manipulatedResult.height,
        };
      }
    } catch (manipulatorError) {
      console.warn('Image manipulator failed, trying fallback:', manipulatorError);
    }

    // Strategy 2: Try FileSystem (Android compatible)
    try {
      console.log('Attempting FileSystem approach...');
      
      // Check if file exists and get info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist at the specified URI');
      }

      console.log('File info:', fileInfo);

      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64 || base64.length === 0) {
        throw new Error('Failed to read file as base64');
      }

      console.log('FileSystem read successful, base64 length:', base64.length);

      const blob = this.base64ToBlob(base64, 'image/jpeg');
      return { blob };

    } catch (fileSystemError) {
      console.warn('FileSystem approach failed, trying final fallback:', fileSystemError);
    }

    // Strategy 3: Final fallback - direct fetch (may not work on some Android versions)
    try {
      console.log('Attempting direct fetch fallback...');
      
      // For Android, sometimes we need to handle file:// URIs specially
      let fetchUri = imageUri;
      if (Platform.OS === 'android' && imageUri.startsWith('file://')) {
        // Try different URI formats for Android
        const attempts = [
          imageUri,
          imageUri.replace('file://', ''),
          `content://media/external/images/media/${imageUri.split('/').pop()}`
        ];
        
        let response: Response | null = null;
        for (const uri of attempts) {
          try {
            response = await fetch(uri);
            if (response.ok) {
              fetchUri = uri;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!response || !response.ok) {
          throw new Error('All fetch attempts failed');
        }
      } else {
        const response = await fetch(fetchUri);
        if (!response.ok) {
          throw new Error(`Fetch failed with status: ${response.status}`);
        }
      }

      const blob = await fetch(fetchUri).then(r => r.blob());
      console.log('Direct fetch successful, blob size:', blob.size);
      
      return { blob };

    } catch (fetchError) {
      console.error('All image processing strategies failed');
      throw new Error(`Failed to process image on ${Platform.OS}. Please try a different image or restart the app.`);
    }
  }

  /**
   * Convert base64 string to Blob
   */
  private static base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
    try {
      // Clean base64 data if it's a data URL
      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Use type assertions to bypass TypeScript's strict type checking
      // React Native's Blob implementation differs from the web standard
      return new Blob([bytes as any], { type: mimeType } as any);
    } catch (error) {
      console.error('Failed to convert base64 to blob:', error);
      throw new Error('Failed to convert base64 to blob');
    }
  }

  /**
   * Validate blob before upload
   */
  private static validateBlob(blob: Blob): void {
    if (!blob) {
      throw new Error('No image data to upload');
    }

    if (blob.size === 0) {
      throw new Error('Image file is empty or corrupted');
    }

    if (blob.size > 52428800) { // 50MB limit
      throw new Error('Image is too large. Please select an image smaller than 50MB.');
    }

    console.log('Blob validation passed:', {
      size: blob.size,
      type: blob.type,
      sizeInMB: (blob.size / (1024 * 1024)).toFixed(2)
    });
  }

  /**
   * Upload blob or ArrayBuffer to Supabase Storage
   */
  private static async uploadToSupabase(bucket: string, filePath: string, blobOrBase64: Blob | string, mimeType?: string) {
    let data;
    let error;
    
    if (Platform.OS === 'android' && typeof blobOrBase64 === 'string') {
      // For Android, use base64-arraybuffer to convert base64 to ArrayBuffer
      console.log('Android: Using base64-arraybuffer for direct upload');
      
      // Clean any data URL prefix if present
      const cleanBase64 = blobOrBase64.replace(/^data:image\/\w+;base64,/, '');
      
      // Upload the ArrayBuffer directly to Supabase
      // Note: Supabase API accepts Uint8Array from decode() for RN Android
      const decodedArray = decode(cleanBase64);
      const result = await supabase.storage
        .from(bucket)
        .upload(filePath, decodedArray as unknown as Blob, {
          contentType: mimeType || 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });
      
      data = result.data;
      error = result.error;
      
    } else {
      // For web and iOS, use blob upload
      const blob = blobOrBase64 as Blob;
      const result = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: blob.type || mimeType || 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create user-friendly error messages
   */

  private static createUserFriendlyError(error: any): Error {
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes('Bucket not found')) {
      return new Error('Storage bucket not found. Please contact support.');
    }
    
    if (errorMessage.includes('not allowed') || errorMessage.includes('policy')) {
      return new Error('Upload not allowed. Please check your permissions.');
    }
    
    if (errorMessage.includes('too large') || errorMessage.includes('size')) {
      return new Error('Image is too large. Please select a smaller image.');
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return new Error('Network error. Please check your internet connection and try again.');
    }
    
    if (errorMessage.includes('authentication') || errorMessage.includes('JWT')) {
      return new Error('Authentication error. Please sign out and sign back in.');
    }

    // Generic error for unknown issues
    return new Error('Failed to upload image. Please try again or contact support if the problem persists.');
  }

  /**
   * Remove image from storage
   */
  static async removeImage(bucket: string, publicUrl: string): Promise<void> {
    try {
      // Extract file path from public URL
      const bucketPath = `supabase.co/storage/v1/object/public/${bucket}/`;
      const pathIndex = publicUrl.indexOf(bucketPath);
      
      if (pathIndex === -1) {
        console.warn('Could not extract file path from URL:', publicUrl);
        return;
      }
      
      const filePath = publicUrl.substring(pathIndex + bucketPath.length);
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);
      
      if (error) {
        console.warn('Error removing image from storage:', error);
      } else {
        console.log('Image removed successfully:', filePath);
      }
    } catch (error) {
      console.warn('Error in removeImage:', error);
    }
  }
}
