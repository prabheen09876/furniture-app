import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, SlidersHorizontal, Star, ShoppingCart } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/utils/format';

type Product = Database['public']['Tables']['products']['Row'];

// Define Category type since it might not be in database types yet
type Category = {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const { width: screenWidth } = Dimensions.get('window');

export default function CategoriesScreen() {
  const { filter } = useLocalSearchParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(filter?.toString() || 'all');

  // Update selected category when filter parameter changes
  useEffect(() => {
    if (filter) {
      setSelectedCategory(filter.toString());
    }
  }, [filter]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Add "All" category at the beginning
      const allCategories = [
        { 
          id: 'all', 
          name: 'All', 
          slug: 'all', 
          icon_url: null,
          description: 'View all products',
          is_active: true,
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Category,
        ...(data || [])
      ];

      setCategories(allCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to default categories if database fetch fails
      const defaultCategories: Category[] = [
        { id: 'all', name: 'All', slug: 'all', icon_url: null, description: 'View all products', is_active: true, sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'chairs', name: 'Chairs', slug: 'chairs', icon_url: null, description: 'Comfortable seating', is_active: true, sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'tables', name: 'Tables', slug: 'tables', icon_url: null, description: 'Dining and work tables', is_active: true, sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'sofas', name: 'Sofas', slug: 'sofas', icon_url: null, description: 'Living room furniture', is_active: true, sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'beds', name: 'Beds', slug: 'beds', icon_url: null, description: 'Bedroom furniture', is_active: true, sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'lamps', name: 'Lamps', slug: 'lamps', icon_url: null, description: 'Lighting solutions', is_active: true, sort_order: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'decor', name: 'Decor', slug: 'decor', icon_url: null, description: 'Home decorations', is_active: true, sort_order: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'storage', name: 'Storage', slug: 'storage', icon_url: null, description: 'Storage solutions', is_active: true, sort_order: 7, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ];
      setCategories(defaultCategories);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gt('stock_quantity', 0); // Only show products with stock

      if (selectedCategory !== 'all') {
        // Filter by category slug
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      // Ensure the product data matches our expected type
      const productsData = (data || []).map(product => ({
        ...product,
        rating: (product as any).rating || null
      })) as Product[];
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    try {
      await addToCart(productId);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
    <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#2D1B16" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity style={styles.filterButton}>
          <SlidersHorizontal size={20} color="#2D1B16" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Category Scroll */}
      <View style={styles.categoryScrollContainer}>
        {categoriesLoading ? (
          <View style={styles.categoriesLoadingContainer}>
            <ActivityIndicator size="small" color="#2D1B16" />
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((category) => {
              // Get fallback icon based on category slug
              const getFallbackIcon = (slug: string) => {
                const iconMap: { [key: string]: string } = {
                  'all': '📦',
                  'chairs': '🪑',
                  'tables': '🪵',
                  'sofas': '🛋️',
                  'beds': '🛏️',
                  'lamps': '💡',
                  'decor': '🖼️',
                  'storage': '🗄️'
                };
                return iconMap[slug] || '📦';
              };

              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.slug && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category.slug)}
                >
                  <BlurView
                    intensity={selectedCategory === category.slug ? 60 : 30}
                    style={styles.categoryButtonInner}
                  >
                    {category.icon_url ? (
                      <Image 
                        source={{ uri: category.icon_url }} 
                        style={styles.categoryIconImage} 
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.categoryIcon}>
                        {getFallbackIcon(category.slug)}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.categoryButtonText,
                        selectedCategory === category.slug && styles.categoryButtonTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </BlurView>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Products Grid */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.productsGrid}>
          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => router.push(`/product/${product.id}`)}
            >
              <BlurView intensity={40} style={styles.productCardInner}>
                <View style={styles.productImageContainer}>
                  <Image source={{ uri: product.image_url || undefined }} style={styles.productImage} />
                  {product.original_price && product.original_price > product.price && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productDescription} numberOfLines={1}>
                    {product.description}
                  </Text>
                  <View style={styles.productFooter}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                      {product.original_price && product.original_price > product.price && (
                        <Text style={styles.originalPrice}>{formatPrice(product.original_price)}</Text>
                      )}
                      <View style={styles.ratingContainer}>
                        <Star size={12} color="#FFD700" fill="#FFD700" strokeWidth={2} />
                        <Text style={styles.rating}>{product.rating?.toFixed(1) || '0.0'}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.addToCartButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product.id);
                      }}
                    >
                      <ShoppingCart size={14} color="#FFFFFF" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryScrollContainer: {
    height: 120,
    paddingVertical: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 16,
  },
  categoryButton: {
    marginRight: 12,
    width: 100,
    height: 100,
  },
  categoryButtonActive: {},
  categoryButtonInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    minWidth: 90,
    height: '100%',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryIconImage: {
    width: 32,
    height: 32,
    marginBottom: 8,
  },
  categoriesLoadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '500',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#2D1B16',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  productCard: {
    width: '48%',  // Changed from (screenWidth - 50) / 2
    marginBottom: 20,
  },
  productCardInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  productImageContainer: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B47',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 4,
    lineHeight: 18,
  },
  productDescription: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainer: {
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D1B16',
  },
  originalPrice: {
    fontSize: 12,
    color: '#8B7355',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 12,
    color: '#8B7355',
    marginLeft: 4,
    fontWeight: '500',
  },
  addToCartButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2D1B16',
    alignItems: 'center',
    justifyContent: 'center',
  },
});