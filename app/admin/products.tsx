import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, Modal, ScrollView, Alert, ActivityIndicator, StyleSheet, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Plus, Search, CreditCard as Edit3, Trash2, Eye, Package, DollarSign, Settings, ChevronDown } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { formatPrice } from '@/utils/format';
import ImageUploader from '@/components/ImageUploader';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

type Product = Database['public']['Tables']['products']['Row'];
type ProductImage = Database['public']['Tables']['product_images']['Row'];
type ProductImageInsert = Database['public']['Tables']['product_images']['Insert'];

// UI Image type for form handling - must match ImageUploader component
interface UIProductImage {
  id?: string;
  image_url: string;
  alt_text?: string; // Remove null to match ImageUploader component
}

// Convert UI images to database format
const toDBImages = (images: UIProductImage[], productId: string): ProductImageInsert[] => {
  return images.map((img, index) => ({
    product_id: productId,
    image_url: img.image_url,
    alt_text: img.alt_text || `Product image ${index + 1}`,
    sort_order: index
  }));
};

// Type for categories from database
type Category = Database['public']['Tables']['categories']['Row'];

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<UIProductImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);
  
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to fetch categories');
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

              if (error) throw error;
              
              setProducts(products.filter(p => p.id !== productId));
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;
      
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, is_active: !p.is_active } : p
      ));
    } catch (error) {
      console.error('Error updating product status:', error);
      Alert.alert('Error', 'Failed to update product status');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#2D1B16" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Products</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <BlurView intensity={40} style={styles.searchBar}>
          <Search size={20} color="#8B7355" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#8B7355"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </BlurView>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <BlurView intensity={40} style={styles.statCard}>
          <Package size={20} color="#4F46E5" strokeWidth={2} />
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </BlurView>
        
        <BlurView intensity={40} style={styles.statCard}>
          <Eye size={20} color="#059669" strokeWidth={2} />
          <Text style={styles.statValue}>{products.filter(p => p.is_active).length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </BlurView>
        
        <BlurView intensity={40} style={styles.statCard}>
          <DollarSign size={20} color="#DC2626" strokeWidth={2} />
          <Text style={styles.statValue}>{products.filter(p => p.stock_quantity && p.stock_quantity < 10).length}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </BlurView>
      </View>

      {/* Products List */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.productsContainer}>
          {filteredProducts.map((product) => (
            <BlurView key={product.id} intensity={40} style={styles.productCard}>
              <Image 
                source={{ uri: product.image_url || require('@/assets/images/placeholder').placeholderImageBase64 }} 
                style={styles.productImage} 
                resizeMode="cover"
              />
              
              <View style={styles.productInfo}>
                <View style={styles.productHeader}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    product.is_active ? styles.activeBadge : styles.inactiveBadge
                  ]}>
                    <Text style={[
                      styles.statusText,
                      product.is_active ? styles.activeText : styles.inactiveText
                    ]}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.productCategory}>{product.category}</Text>
                <Text style={styles.productSku}>SKU: {product.sku}</Text>
                <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                
                <View style={styles.stockInfo}>
                  <Text style={styles.stockText}>
                    Stock: {product.stock_quantity || 0}
                  </Text>
                  {product.stock_quantity && product.stock_quantity < 10 && (
                    <Text style={styles.lowStockText}>Low Stock</Text>
                  )}
                </View>
              </View>

              <View style={styles.productActions}>
                <TouchableOpacity
                  style={styles.productActionButton}
                  onPress={() => toggleProductStatus(product)}
                >
                  <Eye size={16} color={product.is_active ? "#059669" : "#8B7355"} strokeWidth={2} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.productActionButton}
                  onPress={() => setCurrentProduct(product)}
                >
                  <Edit3 size={16} color="#4F46E5" strokeWidth={2} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.productActionButton}
                  onPress={() => deleteProduct(product.id)}
                >
                  <Trash2 size={16} color="#DC2626" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </BlurView>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add/Edit Product Modal */}
      <ProductModal
        visible={showAddModal || !!currentProduct}
        product={currentProduct}
        onClose={() => {
          setShowAddModal(false);
          setCurrentProduct(null);
        }}
        onSave={() => {
          fetchProducts();
          setShowAddModal(false);
          setCurrentProduct(null);
        }}
      />
    </LinearGradient>
  );
}

function ProductModal({ 
  visible, 
  product, 
  onClose, 
  onSave 
}: {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    original_price: '',
    sku: '',
    category: '',
    brand: '',
    stock_quantity: '0',
    is_active: true,
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [skuError, setSkuError] = useState<string | null>(null);

  // State for product images
  const [images, setImages] = useState<UIProductImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form data interface with string values for form inputs
  interface ProductFormData {
    name: string;
    description: string;
    price: string;
    original_price: string;
    sku: string;
    category: string;
    brand: string;
    stock_quantity: string;
    is_active: boolean;
  }

  // Convert database image to UI image
  const toUIImages = (dbImages: ProductImage[] = []): UIProductImage[] => {
    return dbImages
      .filter((img): img is ProductImage & { image_url: string } => 
        !!img && 
        img.image_url !== null && 
        img.image_url !== undefined && 
        img.image_url.trim() !== ''
      )
      .map(img => ({
        id: img.id,
        image_url: img.image_url,
        alt_text: img.alt_text || undefined // Convert null to undefined
      }));
  };

  // Convert UI image to database image format
  const toDBImages = (uiImages: UIProductImage[], productId: string): ProductImageInsert[] => {
    if (!Array.isArray(uiImages)) return [];
    
    return uiImages
      .filter((img): img is UIProductImage & { image_url: string } => 
        !!img && 
        img.image_url !== null && 
        img.image_url !== undefined && 
        img.image_url.trim() !== ''
      )
      .map((img, index) => ({
        product_id: productId,
        image_url: img.image_url,
        alt_text: img.alt_text || null, // Convert undefined to null for database
        sort_order: index
      }));
  };

  // Initialize form data and fetch categories when component mounts

  const fetchProductImages = useCallback(async (productId: string) => {
    try {
      setIsLoadingImages(true);
      
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      setImages(toUIImages(data || []));
    } catch (error) {
      console.error('Error fetching product images:', error);
      setImages([]);
    } finally {
      setIsLoadingImages(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        original_price: product.original_price?.toString() || '',
        category: product.category || '',  // Ensure empty string fallback
        sku: product.sku || '',
        brand: product.brand || '',
        stock_quantity: product.stock_quantity?.toString() || '',
        is_active: product.is_active ?? true,
      });
      
      // Load product images
      fetchProductImages(product.id);
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        original_price: '',
        category: '',
        sku: '',
        brand: '',
        stock_quantity: '',
        is_active: true,
      });
      setImages([]);
    }
    return () => {
      // Cleanup
      setDeletedImageIds([]);
    };
  }, [product, fetchProductImages]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) newErrors.name = 'Product name is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (isNaN(Number(formData.price))) newErrors.price = 'Price must be a valid number';
    if (!formData.sku?.trim()) newErrors.sku = 'SKU is required';
    if (!formData.category?.trim()) newErrors.category = 'Category is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const checkSkuExists = async (sku: string): Promise<boolean> => {
    if (!sku) return false;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('sku', sku.trim())
        .maybeSingle();
        
      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking SKU:', error);
      return false;
    }
  };

  const handleSave = async () => {
    setSkuError(null);
    
    if (!validateForm()) {
      return;
    }
    
    // Check for duplicate SKU
    const skuExists = await checkSkuExists(formData.sku);
    if (skuExists && !product?.id) {
      setSkuError('A product with this SKU already exists');
      Alert.alert('Error', 'A product with this SKU already exists');
      return;
    }
    
    setIsSubmitting(true);
    
    // Convert form data to proper types for database
    const productData: Partial<Product> = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
    };
    
    try {
      // Base product data without ID (for creation)
      const baseProductData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price) || 0,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        image_url: images[0]?.image_url || null,
        category: formData.category || '',  // Use empty string instead of null
        sku: formData.sku,
        brand: formData.brand || null,
        stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
        is_active: formData.is_active,
        created_at: product?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rating: null,
      };

      let productId: string;
      
      if (product?.id) {
        // For update, include the ID
        productId = product.id;
        const updateData = {
          ...baseProductData,
          id: product.id
        };
        
        const { data, error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', product.id)
          .select('id')
          .single();
          
        if (error) {
          console.error('Error updating product:', error);
          throw error;
        }
        
        // Delete removed images if any
        if (deletedImageIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('product_images')
            .delete()
            .in('id', deletedImageIds);
            
          if (deleteError) {
            console.error('Error deleting images:', deleteError);
            throw deleteError;
          }
        }
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert(baseProductData)
          .select('id')
          .single();
          
        if (error) {
          console.error('Error creating product:', error);
          throw error;
        }
        productId = data.id;
      }
      
      // Try to insert images (optional - product can be created without images)
      let imagesSaved = true;
      if (images.length > 0) {
        try {
          const dbImages = toDBImages(images, productId);
          const { error: insertError } = await supabase
            .from('product_images')
            .insert(dbImages);
            
          if (insertError) {
            console.warn('Warning: Could not save product images. Product created without images.', insertError);
            imagesSaved = false;
          }
        } catch (imageError) {
          console.warn('Warning: Image insertion failed. Product created without images.', imageError);
          imagesSaved = false;
        }
      }
      
      // Show appropriate success message
      const successMessage = product 
        ? 'Product updated successfully' 
        : 'Product created successfully';
      const imageWarning = !imagesSaved && images.length > 0 
        ? '\n\nNote: Images could not be saved due to database configuration.' 
        : '';
      
      Alert.alert('Success', successMessage + imageWarning);
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving product:', error);
      let errorMessage = 'Failed to save product. Please try again.';
      
      // Log the full error for debugging
      console.log('Full error object:', JSON.stringify(error, null, 2));
      
      if (error.code === '23505') {
        errorMessage = 'A product with this SKU already exists.';
      } else if (error.details) {
        errorMessage = error.details;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.error_description) {
        errorMessage = error.error_description;
      }
      
      console.error('Error details:', errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (field: keyof ProductFormData, value: string | boolean) => {
    // Clear SKU error when user starts typing
    if (field === 'sku' && skuError) {
      setSkuError(null);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImagesChange = (newImages: ProductImage[] | UIProductImage[]) => {
    if (!Array.isArray(newImages)) {
      setImages([]);
      return;
    }
    
    const validImages = newImages.reduce<UIProductImage[]>((acc, img) => {
      if (!img) return acc;
      
      // Handle DB format
      if ('product_id' in img) {
        const dbImg = img as ProductImage;
        if (dbImg.image_url) {
          acc.push({
            id: dbImg.id,
            image_url: dbImg.image_url,
            alt_text: dbImg.alt_text || undefined
          });
        }
      } 
      // Handle UI format
      else if ('image_url' in img) {
        const uiImg = img as UIProductImage;
        if (uiImg.image_url) {
          acc.push({
            id: uiImg.id,
            image_url: uiImg.image_url,
            alt_text: uiImg.alt_text
          });
        }
      }
      
      return acc;
    }, []);
    
    setImages(validImages);
  };

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
          // Mobile platform - Use expo-file-system for reliable file reading
          console.log('Mobile platform detected, using expo-file-system for:', imageUri);
          
          let mimeType = 'image/jpeg'; // default
          let base64Data: string | null = null;
          
          try {
            // Determine MIME type from file extension
            const extension = imageUri.split('.').pop()?.toLowerCase();
            if (extension === 'png') mimeType = 'image/png';
            else if (extension === 'webp') mimeType = 'image/webp';
            else if (extension === 'gif') mimeType = 'image/gif';
            
            // Read file as base64 using expo-file-system
            base64Data = await FileSystem.readAsStringAsync(imageUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            if (!base64Data || base64Data.length === 0) {
              throw new Error('Base64 data is empty after FileSystem read');
            }
            
            console.log('FileSystem base64 data length:', base64Data.length);
            
            // For Android, we'll upload the base64 directly to Supabase
            // Supabase Storage accepts base64 encoded data
            console.log('Using base64 upload for Android');
            
          } catch (fileSystemError) {
            console.error('FileSystem read failed:', fileSystemError);
            throw new Error('Unable to read image file on Android. Please try selecting a different image.');
          }
          
          // For Android, we'll handle the upload differently
          if (base64Data) {
            console.log('Attempting upload to path:', filePath);
            console.log('Base64 data length:', base64Data.length);
            
            // Create a blob from base64 using the decode function from Supabase
            // This approach has been tested to work with React Native Android
            const base64FileData = base64Data.replace(/^data:image\/\w+;base64,/, '');
            const { data, error } = await supabase.storage
              .from('products')
              .upload(filePath, decode(base64FileData), {
                contentType: mimeType,
                cacheControl: '3600',
                upsert: false
              });
            
            if (error) {
              console.error('Storage upload error:', error);
              console.error('Error details:', JSON.stringify(error, null, 2));
              
              // Provide specific error messages
              if (error.message?.includes('bucket')) {
                throw new Error('Storage bucket not found. Please run the storage setup SQL script first.');
              } else if (error.message?.includes('policy')) {
                throw new Error('Permission denied. Please check storage policies.');
              } else if (error.message?.includes('size')) {
                throw new Error('Image file is too large. Please select a smaller image.');
              } else if (error.message?.includes('content')) {
                throw new Error('No content provided. The image data may be corrupted.');
              } else {
                throw new Error(`Upload failed: ${error.message}`);
              }
            }
            
            console.log('Upload successful:', data);
            
            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
              .from('products')
              .getPublicUrl(filePath);
            
            console.log('Android upload: public URL generated:', publicUrl);
            
            // Create a new UI product image directly from the Android upload
            // Skip the regular upload code below since we've already uploaded
            const newImage: UIProductImage = {
              id: `temp-${timestamp}-${randomId}`,
              image_url: publicUrl,
              alt_text: `Product image ${images.length + 1}`
            };
            
            // Update the images array
            const updatedImages = [...images, newImage];
            setImages(updatedImages);
            
            console.log('Image uploaded successfully:', newImage);
            return newImage;
          } else {
            throw new Error('Failed to process image data');
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
          contentType: blob.type || 'image/jpeg',
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

  const handleImageRemove = async (imageId?: string) => {
    if (!imageId) return;
    
    try {
      // Find the image to remove
      const imageToRemove = images.find(img => img.id === imageId);
      if (!imageToRemove) return;
      
      // Extract file path from the public URL
      const url = imageToRemove.image_url;
      if (url.includes('supabase.co/storage/v1/object/public/products/')) {
        const filePath = url.split('supabase.co/storage/v1/object/public/products/')[1];
        
        if (filePath) {
          // Remove from Supabase Storage
          const { error } = await supabase.storage
            .from('products')
            .remove([filePath]);
          
          if (error) {
            console.warn('Warning: Could not delete image from storage:', error);
            // Continue with removal from UI even if storage deletion fails
          }
        }
      }
      
      // Remove from local state
      const updatedImages = images.filter(img => img.id !== imageId);
      setImages(updatedImages);
      
    } catch (error) {
      console.error('Error removing image:', error);
      // Still remove from UI even if storage deletion fails
      const updatedImages = images.filter(img => img.id !== imageId);
      setImages(updatedImages);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.modalContainer}>
        <BlurView intensity={30} tint="light" style={styles.modalHeader}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={onClose}
            disabled={isSubmitting}
          >
            <ArrowLeft size={20} color="#2D1B16" strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.modalTitle}>
              {product ? 'Edit Product' : 'Add New Product'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {product ? 'Update product details' : 'Fill in the product information'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.headerSaveButton,
              isSubmitting && styles.headerSaveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.headerSaveButtonText}>
                {product ? 'Update' : 'Save'}
              </Text>
            )}
          </TouchableOpacity>
        </BlurView>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Basic Information Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Package size={20} color="#2D1B16" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            
            <BlurView intensity={25} tint="light" style={styles.formCard}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Name *</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.name && styles.inputError
                  ]}
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  placeholder="Enter product name"
                  placeholderTextColor="#8B7355"
                  editable={!isSubmitting}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => handleInputChange('description', text)}
                  placeholder="Describe your product..."
                  placeholderTextColor="#8B7355"
                  multiline
                  numberOfLines={4}
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroupHalf, { zIndex: 1 }]}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.dropdownWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.dropdownContainer,
                        showCategoryDropdown && styles.dropdownContainerActive
                      ]}
                      onPress={() => !isSubmitting && setShowCategoryDropdown(!showCategoryDropdown)}
                      disabled={isSubmitting}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.dropdownText,
                        !formData.category && styles.dropdownPlaceholder
                      ]}>
                        {categories.find(c => c.slug === formData.category)?.name || 'Select category'}
                      </Text>
                      <ChevronDown 
                        size={20} 
                        color="#8B7355" 
                        style={[
                          styles.dropdownIcon,
                          showCategoryDropdown && styles.dropdownIconRotated
                        ]} 
                      />
                    </TouchableOpacity>

                  </View>
                </View>

                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Brand</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.brand}
                    onChangeText={(text) => handleInputChange('brand', text)}
                    placeholder="Brand name"
                    placeholderTextColor="#8B7355"
                    editable={!isSubmitting}
                  />
                </View>
              </View>
            </BlurView>
          </View>

          {/* Pricing Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <DollarSign size={20} color="#2D1B16" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Pricing & Inventory</Text>
            </View>
            
            <BlurView intensity={25} tint="light" style={styles.formCard}>
              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Selling Price *</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.priceInput,
                        errors.price && styles.inputError
                      ]}
                      value={formData.price}
                      onChangeText={(text) => {
                        // Allow only numbers and one decimal point
                        if (text === '' || /^\d*\.?\d*$/.test(text)) {
                          handleInputChange('price', text);
                        }
                      }}
                      placeholder="0.00"
                      placeholderTextColor="#8B7355"
                      keyboardType="decimal-pad"
                      editable={!isSubmitting}
                    />
                  </View>
                  {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
                </View>

                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Original Price</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.priceInput,
                        errors.original_price && styles.inputError
                      ]}
                      value={formData.original_price}
                      onChangeText={(text) => {
                        // Allow only numbers and one decimal point
                        if (text === '' || /^\d*\.?\d*$/.test(text)) {
                          handleInputChange('original_price', text);
                        }
                      }}
                      placeholder="0.00"
                      placeholderTextColor="#8B7355"
                      keyboardType="decimal-pad"
                      editable={!isSubmitting}
                    />
                  </View>
                  {errors.original_price && <Text style={styles.errorText}>{errors.original_price}</Text>}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>SKU *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      skuError && styles.inputError
                    ]}
                    value={formData.sku || ''}
                    onChangeText={(text) => handleInputChange('sku', text)}
                    placeholder="Enter unique SKU"
                    placeholderTextColor="#8B7355"
                    editable={!isSubmitting}
                  />
                  {skuError && (
                    <Text style={styles.errorText}>{skuError}</Text>
                  )}
                </View>

                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Stock Quantity</Text>
                  <TextInput
                    style={[
                      styles.input,
                      isNaN(Number(formData.stock_quantity)) && styles.inputError
                    ]}
                    value={formData.stock_quantity}
                    onChangeText={(text) => {
                      // Only allow numbers
                      if (text === '' || /^\d+$/.test(text)) {
                        setFormData({ ...formData, stock_quantity: text });
                      }
                    }}
                    placeholder="0"
                    placeholderTextColor="#8B7355"
                    keyboardType="number-pad"
                    editable={!isSubmitting}
                  />
                  {isNaN(Number(formData.stock_quantity)) && (
                    <Text style={styles.errorText}>Must be a number</Text>
                  )}
                </View>
              </View>
            </BlurView>
          </View>

          {/* Product Images Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Eye size={20} color="#2D1B16" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Product Images</Text>
              <Text style={styles.sectionSubtitle}>Add up to 5 images</Text>
            </View>
            
            <BlurView intensity={25} tint="light" style={styles.formCard}>
              {isLoadingImages ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#2D1B16" />
                  <Text style={styles.loadingText}>Loading images...</Text>
                </View>
              ) : (
                <View style={styles.imageUploaderContainer}>
                  <ImageUploader
                    images={images}
                    onChange={handleImagesChange}
                    onImageUpload={handleImageUpload}
                    onRemoveImage={handleImageRemove}
                    maxImages={5}
                    isUploading={isUploading}
                  />
                  {errors.images && (
                    <Text style={styles.errorText}>{errors.images}</Text>
                  )}
                </View>
              )}
            </BlurView>
          </View>

          {/* Product Status Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Settings size={20} color="#2D1B16" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Product Status</Text>
            </View>
            
            <BlurView intensity={25} tint="light" style={styles.formCard}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  isSubmitting && styles.toggleButtonDisabled
                ]}
                onPress={() => !isSubmitting && setFormData({ ...formData, is_active: !formData.is_active })}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <View style={styles.toggleContent}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>
                      {formData.is_active ? 'Product is Active' : 'Product is Inactive'}
                    </Text>
                    <Text style={styles.toggleDescription}>
                      {formData.is_active 
                        ? 'Customers can see and purchase this product' 
                        : 'Product is hidden from customers'
                      }
                    </Text>
                  </View>
                  <View style={[
                    styles.toggle,
                    formData.is_active ? styles.toggleActive : styles.toggleInactive,
                    isSubmitting && styles.toggleDisabled
                  ]}>
                    <View style={[
                      styles.toggleThumb,
                      formData.is_active && styles.thumbActive,
                      isSubmitting && styles.thumbDisabled
                    ]} />
                  </View>
                </View>
              </TouchableOpacity>
            </BlurView>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.cancelActionButton,
                isSubmitting && styles.actionButtonDisabled
              ]}
              onPress={onClose}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelActionButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.saveActionButton,
                isSubmitting && styles.saveActionButtonDisabled
              ]}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              {isSubmitting ? (
                <View style={styles.savingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.saveActionButtonText}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.saveActionButtonText}>
                  {product ? 'Update Product' : 'Add Product'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
        
        {/* Category Dropdown - Positioned outside ScrollView to prevent clipping */}
        {showCategoryDropdown && (
          <>
            <TouchableOpacity 
              style={styles.dropdownBackdrop}
              onPress={() => setShowCategoryDropdown(false)}
              activeOpacity={1}
            />
            <View style={styles.dropdownOverlay}>
              <BlurView intensity={20} tint="light" style={styles.dropdownMenu}>
                <ScrollView 
                  style={styles.dropdownScrollView}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.dropdownItem,
                        formData.category === category.slug && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        handleInputChange('category', category.slug);
                        setShowCategoryDropdown(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        formData.category === category.slug && styles.dropdownItemTextSelected
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </BlurView>
            </View>
          </>
        )}
      </LinearGradient>
    </Modal>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D1B16',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D1B16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#2D1B16',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B7355',
  },
  scrollView: {
    flex: 1,
  },
  productsContainer: {
    paddingHorizontal: 20,
  },
  productCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeText: {
    color: '#059669',
  },
  inactiveText: {
    color: '#9CA3AF',
  },
  productCategory: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 2,
  },
  productSku: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 4,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 12,
    color: '#8B7355',
  },
  lowStockText: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  productActions: {
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  productActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  // Header styles
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  headerSaveButton: {
    backgroundColor: '#2D1B16',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerSaveButtonDisabled: {
    backgroundColor: '#8B7355',
    opacity: 0.7,
  },
  headerSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  // Section styles
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#8B7355',
    marginLeft: 'auto',
    fontFamily: 'Inter-Regular',
  },
  formCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  // Price input styles
  priceInputContainer: {
    position: 'relative',
  },
  // Image uploader styles
  imageUploaderContainer: {
    width: '100%',
  },
  // Enhanced toggle styles
  toggleButtonDisabled: {
    opacity: 0.6,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleDescription: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  // Action buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.5,
    borderColor: '#E8D5C4',
  },
  saveActionButton: {
    backgroundColor: '#2D1B16',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  saveActionButtonDisabled: {
    backgroundColor: '#8B7355',
    opacity: 0.7,
  },
  cancelActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
    fontFamily: 'Inter-SemiBold',
  },
  saveActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomSpacing: {
    height: 40,
  },
  // Loading and misc styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 12,
    marginVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#2D1B16',
    fontSize: 14,
  },
  thumbDisabled: {
    opacity: 0.5,
  },
  // Dropdown styles
  dropdownWrapper: {
    position: 'relative',
    zIndex: 1,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 200, // Position aligned with category field
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 20,
    maxHeight: 300, // Limit height to prevent overflow
  },
  dropdownContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8D5C4',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  dropdownContainerActive: {
    borderColor: '#2D1B16',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  dropdownText: {
    fontSize: 16,
    color: '#2D1B16',
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#8B7355',
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  dropdownIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownMenuContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 20,
  },
  dropdownMenu: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8D5C4',
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 213, 196, 0.3)',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(45, 27, 22, 0.1)',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#2D1B16',
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
    color: '#2D1B16',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5C4',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  formGroupHalf: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1B16',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#2D1B16',
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priceInput: {
    paddingLeft: 30,
  },
  currencySymbol: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -8 }],
    color: '#8B7355',
    fontSize: 16,
    zIndex: 1,
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#2D1B16',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleInactive: {
    backgroundColor: '#9CA3AF',
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  thumbActive: {
    transform: [{ translateX: 22 }],
  },
  // Button styles
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#2D1B16',
  },
  saveButtonDisabled: {
    backgroundColor: '#8B7355',
    opacity: 0.7,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2D1B16',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
  },
  cancelButtonText: {
    color: '#2D1B16',
    fontSize: 16,
  },
  // Use saveActionButtonText instead for consistency
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});