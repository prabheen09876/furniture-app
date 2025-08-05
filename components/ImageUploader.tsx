import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerResult, MediaTypeOptions } from 'expo-image-picker';
import { X, ImagePlus } from 'lucide-react-native';
import { ProductImage as DBProductImage } from '@/types/database';

// Define the image type for the UI
export type UIProductImage = {
  id?: string;
  image_url: string;
  alt_text?: string;
};

type ImageUploaderProps = {
  images: DBProductImage[] | UIProductImage[];
  onChange: (images: UIProductImage[]) => void;
  onImageUpload?: (imageUri: string) => Promise<UIProductImage>;
  onRemoveImage?: (imageId?: string) => void;
  maxImages?: number;
  isUploading?: boolean;
};

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images = [],
  onChange,
  onImageUpload,
  onRemoveImage,
  maxImages = 5,
  isUploading = false,
}) => {
  // isUploading is passed as a prop from the parent component to show loading state

  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Maximum images reached', `You can upload up to ${maxImages} images per product.`);
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant camera roll permissions to upload images.');
        return;
      }

      // The parent component should handle the loading state
      const result: ImagePickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const imageUri = result.assets[0].uri;
        
        if (onImageUpload) {
          try {
            // Upload image to Supabase Storage via parent component
            const newImage = await onImageUpload(imageUri);
            if (newImage) {
              // The parent component handles adding the image to the array
              // No need to call onChange here as it's handled in handleImageUpload
            }
          } catch (error) {
            console.error('Error uploading image:', error);
            Alert.alert('Error', 'Failed to upload image. Please try again.');
          }
        } else {
          // No upload handler provided - this should not happen
          Alert.alert('Error', 'Image upload is not configured properly.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    if (onRemoveImage) {
      onRemoveImage(imageToRemove.id);
    }
    
    const newImages = [...images] as UIProductImage[];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const updateAltText = (index: number, text: string) => {
    const newImages = [...images] as UIProductImage[];
    newImages[index] = { 
      ...newImages[index], 
      alt_text: text || undefined
    };
    onChange(newImages);
  };

  if (isUploading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Uploading image...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Product Images ({images.length}/{maxImages})</Text>
      
      <View style={styles.imagesContainer}>
        {images.map((img, index) => (
          <View 
            key={img.id || `img-${index}`}
            style={styles.imageContainer}
          >
            <Image 
              source={{ uri: img.image_url }} 
              style={styles.image} 
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => removeImage(index)}
            >
              <X size={16} color="#fff" />
            </TouchableOpacity>
            <View style={styles.altTextContainer}>
              <TextInput
                style={styles.altTextInput}
                value={img.alt_text || ''}
                onChangeText={(text) => updateAltText(index, text)}
                placeholder="Alt text"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        ))}

        {images.length < maxImages && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={pickImage}
            disabled={isUploading}
          >
            <ImagePlus size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  imageContainer: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    position: 'relative',
    margin: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  altTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
  },
  altTextInput: {
    color: '#fff',
    fontSize: 12,
    padding: 2,
  },
  addButton: {
    width: '31%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    margin: 4,
    backgroundColor: '#f9f9f9',
  },
  addButtonText: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  imageLimitText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
});

export default ImageUploader;
