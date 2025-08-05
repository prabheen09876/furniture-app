import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

export interface AndroidImageUploadResult {
  publicUrl: string;
  filePath: string;
  success: boolean;
  error?: string;
}

/**
 * Android-specific image upload utility for APK builds
 * This addresses common network issues in production Android builds
 */
export class AndroidImageUploadService {
  
  /**
   * Upload image with Android APK-optimized approach
   */
  static async uploadImageForAndroid(
    imageUri: string,
    bucket: string = 'products',
    folder: string = 'product-images'
  ): Promise<AndroidImageUploadResult> {
    console.log('🚀 Starting Android image upload process...');
    console.log('📱 Platform:', Platform.OS);
    console.log('🖼️ Image URI:', imageUri);
    
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const filename = `${timestamp}-${randomId}.jpeg`;
      const filePath = `${folder}/${filename}`;
      
      console.log('📁 Target path:', filePath);
      
      // Step 1: Process image using expo-image-manipulator (more reliable on Android)
      const processedImage = await this.processImageForAndroid(imageUri);
      if (!processedImage.success) {
        throw new Error(processedImage.error || 'Failed to process image');
      }
      
      // Step 2: Convert to blob using FileSystem (Android-compatible)
      const blob = await this.createBlobForAndroid(processedImage.uri!);
      if (!blob) {
        throw new Error('Failed to create blob from processed image');
      }
      
      console.log('✅ Blob created successfully:', {
        size: blob.size,
        type: blob.type,
        sizeInMB: (blob.size / (1024 * 1024)).toFixed(2)
      });
      
      // Step 3: Upload to Supabase with retry mechanism
      const uploadResult = await this.uploadWithRetry(bucket, filePath, blob);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }
      
      // Step 4: Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      console.log('🎉 Upload completed successfully!');
      console.log('🔗 Public URL:', publicUrl);
      
      return {
        publicUrl,
        filePath,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Android upload failed:', error);
      return {
        publicUrl: '',
        filePath: '',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Process image specifically for Android APK builds
   */
  private static async processImageForAndroid(imageUri: string): Promise<{
    success: boolean;
    uri?: string;
    error?: string;
  }> {
    try {
      console.log('🔄 Processing image for Android...');
      
      // Use expo-image-manipulator which is more reliable on Android
      const manipulatedImage = await manipulateAsync(
        imageUri,
        [
          { 
            resize: { 
              width: 2048, 
              height: 2048 
            } 
          }
        ],
        {
          compress: 0.8,
          format: SaveFormat.JPEG, // Always use JPEG for better compatibility
          base64: false // Don't use base64 to avoid memory issues
        }
      );
      
      console.log('✅ Image processed successfully:', {
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        uri: manipulatedImage.uri
      });
      
      return {
        success: true,
        uri: manipulatedImage.uri
      };
      
    } catch (error) {
      console.error('❌ Image processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Create blob using FileSystem API (Android-compatible)
   */
  private static async createBlobForAndroid(imageUri: string): Promise<Blob | null> {
    try {
      console.log('📄 Creating blob using FileSystem API...');
      
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (!base64) {
        throw new Error('Failed to read image as base64');
      }
      
      console.log('📊 Base64 length:', base64.length);
      
      // Convert base64 to blob
      const blob = this.base64ToBlob(base64, 'image/jpeg');
      
      console.log('✅ Blob created:', {
        size: blob.size,
        type: blob.type
      });
      
      return blob;
      
    } catch (error) {
      console.error('❌ Blob creation failed:', error);
      return null;
    }
  }
  
  /**
   * Convert base64 to blob
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
      throw new Error('Failed to convert base64 to blob: ' + String(error));
    }
  }
  
  /**
   * Upload with retry mechanism for Android network issues
   */
  private static async uploadWithRetry(
    bucket: string, 
    filePath: string, 
    blob: Blob,
    maxRetries: number = 3
  ): Promise<{ success: boolean; error?: string }> {
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Upload attempt ${attempt}/${maxRetries}...`);
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) {
          console.error(`❌ Upload attempt ${attempt} failed:`, error);
          
          // If it's the last attempt, throw the error
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        console.log(`✅ Upload successful on attempt ${attempt}`);
        return { success: true };
        
      } catch (error) {
        console.error(`❌ Upload attempt ${attempt} error:`, error);
        
        if (attempt === maxRetries) {
          return {
            success: false,
            error: this.getErrorMessage(error)
          };
        }
        
        // Wait before retry
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return {
      success: false,
      error: 'All upload attempts failed'
    };
  }
  
  /**
   * Get user-friendly error message
   */
  private static getErrorMessage(error: any): string {
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes('Bucket not found')) {
      return 'Storage bucket not found. Please contact support.';
    }
    
    if (errorMessage.includes('not allowed') || errorMessage.includes('policy')) {
      return 'Upload not allowed. Please check your permissions.';
    }
    
    if (errorMessage.includes('too large') || errorMessage.includes('size')) {
      return 'Image is too large. Please select a smaller image.';
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    if (errorMessage.includes('timeout')) {
      return 'Upload timeout. Please try again with a better internet connection.';
    }
    
    return 'Failed to upload image. Please try again or contact support if the problem persists.';
  }
}
