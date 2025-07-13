import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, Modal, ScrollView, Alert, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { ProductImage as DBProductImage } from '@/types/database';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Plus, Search, CreditCard as Edit3, Trash2, Eye, Package, DollarSign } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { formatPrice } from '@/utils/format';
import ImageUploader from '@/components/ImageUploader';

type Product = Database['public']['Tables']['products']['Row'];

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

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
                source={{ uri: product.image_url || 'https://via.placeholder.com/150' }} 
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
                  style={styles.actionButton}
                  onPress={() => toggleProductStatus(product)}
                >
                  <Eye size={16} color={product.is_active ? "#059669" : "#8B7355"} strokeWidth={2} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setCurrentProduct(product)}
                >
                  <Edit3 size={16} color="#4F46E5" strokeWidth={2} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
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

// Product Modal Component
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [skuError, setSkuError] = useState<string | null>(null);

  // Our local UI type for product images
  interface UIProductImage {
    id?: string;
    image_url: string;
    alt_text?: string;
  }

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
  const toUIImages = (dbImages: DBProductImage[] = []): UIProductImage[] => {
    return dbImages
      .filter((img): img is DBProductImage & { image_url: string } => 
        !!img && 
        img.image_url !== null && 
        img.image_url !== undefined && 
        img.image_url.trim() !== ''
      )
      .map(img => ({
        id: img.id,
        image_url: img.image_url,
        alt_text: img.alt_text || undefined
      }));
  };

  // Convert UI image to database image format
  const toDBImages = (uiImages: UIProductImage[], productId: string): Array<{
    product_id: string;
    image_url: string;
    alt_text: string | null;
    sort_order: number;
  }> => {
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
        alt_text: img.alt_text || null,
        sort_order: index
      }));
  };

  const [images, setImages] = useState<UIProductImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

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

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        original_price: product.original_price?.toString() || '',
        category: product.category || '',
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
        category: formData.category,
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
      
      // Insert all images with the correct sort order
      if (images.length > 0) {
        const dbImages = toDBImages(images, productId);
        const { error: insertError } = await supabase
          .from('product_images')
          .insert(dbImages);
          
        if (insertError) {
          console.error('Error inserting images:', insertError);
          throw insertError;
        }
      }
      
      Alert.alert('Success', `Product ${product ? 'updated' : 'created'} successfully`);
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

  const handleImagesChange = (newImages: DBProductImage[] | UIProductImage[]) => {
    if (!Array.isArray(newImages)) {
      setImages([]);
      return;
    }
    
    const validImages = newImages.reduce<UIProductImage[]>((acc, img) => {
      if (!img) return acc;
      
      // Handle DB format
      if ('product_id' in img) {
        const dbImg = img as DBProductImage;
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
      // In a real app, you would upload the image to your storage here
      // For now, we'll just create a local image object
      const newImage: UIProductImage = {
        image_url: imageUri,
        alt_text: `Product image ${images.length + 1}`
      };
      
      // Update the images array
      const updatedImages = [...images, newImage];
      setImages(updatedImages);
      
      return newImage;
    } catch (error) {
      console.error('Error handling image upload:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {product ? 'Edit Product' : 'Add Product'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
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
              placeholder="Enter product description"
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>Price *</Text>
              <View style={{ position: 'relative' }}>
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
                  placeholder="0"
                  keyboardType="decimal-pad"
                  editable={!isSubmitting}
                />
              </View>
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            </View>

            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>Original Price</Text>
              <View style={{ position: 'relative' }}>
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
                  placeholder="0"
                  keyboardType="decimal-pad"
                  editable={!isSubmitting}
                />
              </View>
              {errors.original_price && <Text style={styles.errorText}>{errors.original_price}</Text>}
            </View>
          </View>

          <View style={styles.formGroup}>
            {isLoadingImages ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Loading images...</Text>
              </View>
            ) : (
              <View style={{ width: '100%' }}>
                <ImageUploader
                  images={images}
                  onChange={handleImagesChange}
                  onImageUpload={handleImageUpload}
                  onRemoveImage={(imageId) => {
                    if (imageId) {
                      setDeletedImageIds(prev => [...prev, imageId]);
                    }
                  }}
                  maxImages={5}
                  isUploading={isUploading}
                />
                {errors.images && (
                  <Text style={styles.errorText}>{errors.images}</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>SKU *</Text>
                <TextInput
                  style={[
                    styles.input,
                    skuError && styles.inputError
                  ]}
                  value={formData.sku || ''}
                  onChangeText={(text) => handleInputChange('sku', text)}
                  placeholder="Enter unique SKU"
                  placeholderTextColor="#999"
                />
                {skuError && (
                  <Text style={styles.errorText}>{skuError}</Text>
                )}
              </View>
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
                keyboardType="number-pad"
                editable={!isSubmitting}
              />
              {isNaN(Number(formData.stock_quantity)) && (
                <Text style={styles.errorText}>Must be a number</Text>
              )}
            </View>
          </View>

          <View style={styles.formGroup}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => !isSubmitting && setFormData({ ...formData, is_active: !formData.is_active })}
              disabled={isSubmitting}
            >
              <Text style={styles.toggleLabel}>
                {formData.is_active ? 'Active' : 'Inactive'} Product
              </Text>
              <View style={[
                styles.toggle,
                formData.is_active ? styles.toggleActive : styles.toggleInactive,
                isSubmitting && styles.toggleDisabled
              ]}>
                <View style={[
                  styles.toggleThumb,
                  formData.is_active ? styles.thumbActive : styles.thumbInactive,
                  isSubmitting && styles.thumbDisabled
                ]} />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.saveButton,
                isSubmitting && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

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
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  // Add missing styles
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
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
  thumbInactive: {
  },
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
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});