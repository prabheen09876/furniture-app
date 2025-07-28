import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Heart, Star, ShoppingCart, Plus, Minus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { formatPrice } from '@/utils/format';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';

type Product = Database['public']['Tables']['products']['Row'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    let isMounted = true;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id as string)
        .single();

      if (error) throw error;
      if (isMounted) {
        setProduct(data);
        // Fetch product images
        await fetchProductImages(data.image_url);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
    
    return () => {
      isMounted = false;
    };
  };

  const fetchProductImages = async (fallbackImage?: string | null) => {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', id as string)
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('Error fetching product images:', error);
        // Use fallback image if available
        if (fallbackImage) {
          setProductImages([fallbackImage]);
        }
        return;
      }

      const imageUrls = data?.map(img => img.image_url) || [];
      
      if (imageUrls.length > 0) {
        setProductImages(imageUrls);
      } else if (fallbackImage) {
        // Use fallback image if no images found in product_images table
        setProductImages([fallbackImage]);
      }
    } catch (error) {
      console.warn('Error fetching product images:', error);
      // Use fallback image if available
      if (fallbackImage) {
        setProductImages([fallbackImage]);
      }
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to add items to cart');
      router.push('/auth' as any);
      return;
    }

    if (!product) return;

    try {
      for (let i = 0; i < quantity; i++) {
        await addToCart(product.id);
      }
      Alert.alert('Success', `Added ${quantity} item(s) to cart`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to add items to wishlist');
      router.push('/auth' as any);
      return;
    }

    if (!product) return;

    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update wishlist');
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!product) {
    return (
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Product not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Use the productImages state that includes all images from product_images table

  return (
    <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#2D1B16" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleWishlistToggle}>
            <Heart 
              size={20} 
              color={isInWishlist(product.id) ? "#FF6B47" : "#2D1B16"} 
              fill={isInWishlist(product.id) ? "#FF6B47" : "transparent"}
              strokeWidth={2} 
            />
          </TouchableOpacity>
        </View>

        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setSelectedImageIndex(index);
            }}
          >
            {productImages.map((image: string, index: number) => (
              <View key={index} style={styles.imageSlide}>
                <Image source={{ uri: image }} style={styles.productImage} />
              </View>
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          {productImages.length > 1 && (
            <View style={styles.imageIndicators}>
              {productImages.map((_: string, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    selectedImageIndex === index && styles.activeIndicator
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <BlurView intensity={60} style={styles.infoContainer}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#FFD700" fill="#FFD700" strokeWidth={2} />
              <Text style={styles.ratingText}>{product.rating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.reviewCount}>(0 reviews)</Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.original_price && product.original_price > product.price && (
              <Text style={styles.originalPrice}>{formatPrice(product.original_price)}</Text>
            )}
          </View>

          {product.brand && (
            <Text style={styles.brand}>by {product.brand}</Text>
          )}

          <Text style={styles.description}>{product.description}</Text>

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            <View style={[
              styles.stockIndicator,
              product.stock_quantity > 0 ? styles.inStock : styles.outOfStock
            ]} />
            <Text style={styles.stockText}>
              {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
            </Text>
            {product.stock_quantity > 0 && (
              <Text style={styles.stockQuantity}>
                ({product.stock_quantity} available)
              </Text>
            )}
          </View>

          {/* Quantity Selector */}
          {product.stock_quantity > 0 && (
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus size={16} color="#2D1B16" strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                >
                  <Plus size={16} color="#2D1B16" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Product Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Product Details</Text>
            {product.sku && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>SKU:</Text>
                <Text style={styles.detailValue}>{product.sku}</Text>
              </View>
            )}
            {product.brand && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Brand:</Text>
                <Text style={styles.detailValue}>{product.brand}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{product.category}</Text>
            </View>
          </View>
        </BlurView>
      </ScrollView>

      {/* Fixed Bottom Actions */}
      {product.stock_quantity > 0 && (
        <BlurView intensity={95} style={styles.bottomActions}>
          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
            <ShoppingCart size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </BlurView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#2D1B16',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#2D1B16',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2D1B16',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    height: SCREEN_WIDTH,
    marginBottom: 20,
  },
  imageSlide: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    paddingHorizontal: 20,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    resizeMode: 'cover',
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#2D1B16',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 20,
    borderRadius: 30,
    padding: 30,
    marginBottom: 160, // Increased to account for floating add to cart button
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  productHeader: {
    marginBottom: 16,
  },
  productName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#8B7355',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1B16',
  },
  originalPrice: {
    fontSize: 18,
    color: '#8B7355',
    textDecorationLine: 'line-through',
    marginLeft: 12,
  },
  brand: {
    fontSize: 16,
    color: '#8B7355',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#2D1B16',
    lineHeight: 24,
    marginBottom: 20,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  inStock: {
    backgroundColor: '#059669',
  },
  outOfStock: {
    backgroundColor: '#DC2626',
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
  },
  stockQuantity: {
    fontSize: 14,
    color: '#8B7355',
    marginLeft: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 115, 85, 0.2)',
    paddingTop: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8B7355',
  },
  detailValue: {
    fontSize: 14,
    color: '#2D1B16',
    fontWeight: '500',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 80, 
    left: 20,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  addToCartButton: {
    backgroundColor: '#2D1B16',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});