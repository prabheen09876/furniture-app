import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';

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
        uploadPath: uploadResult.path
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
    
    // Strategy 1: Try expo-image-manipulator (best quality, Android compatible)
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
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return new Blob([bytes], { type: mimeType });
    } catch (error) {
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
   * Upload blob to Supabase Storage
   */
  private static async uploadToSupabase(bucket: string, filePath: string, blob: Blob) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType: blob.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

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
