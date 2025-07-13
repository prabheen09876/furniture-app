import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Platform,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Search, Bell, ChevronDown } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};
import { Database } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

type Product = Database['public']['Tables']['products']['Row'];

const { width: screenWidth } = Dimensions.get('window');

const categories = [
  { id: 'chairs', name: 'Chairs', icon: '🪑' },
  { id: 'tables', name: 'Tables', icon: '🪑' },
  { id: 'lamps', name: 'Lamps', icon: '💡' },
  { id: 'decor', name: 'Decor', icon: '🏺' },
];

// Layout constants
const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 100;
const CATEGORIES_HEIGHT = 160;
const TAB_BAR_HEIGHT = 60;
const SCREEN_PADDING = 16;
const TOP_SECTION_HEIGHT = HEADER_HEIGHT + CATEGORIES_HEIGHT;

const renderHeader = () => (
  <View style={styles.headerContainer}>
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>Good Morning</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Casa</Text>
          <View style={styles.notificationButton}>
            <Bell size={22} color="#2D1B16" strokeWidth={2} />
            <View style={styles.notificationDot} />
          </View>
        </View>
        <Text style={styles.subtitle}>Beautiful furniture for your home</Text>
      </View>
    </View>

    {/* Search Bar */}
    <View style={styles.searchWrapper}>
      <TouchableOpacity 
        onPress={() => router.push('/search')}
        activeOpacity={0.8}
      >
        <View style={styles.searchContainer}>
          <Search size={18} color="#8B7355" strokeWidth={2} />
          <Text style={styles.searchPlaceholder}>Search furniture, decor, and more</Text>
        </View>
      </TouchableOpacity>
    </View>
  </View>
);

const renderCategories = () => (
  <View style={styles.categoriesContainer}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Shop by Category</Text>
      <TouchableOpacity>
        <Text style={styles.seeAllText}>See All</Text>
      </TouchableOpacity>
    </View>
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesScrollContainer}
    >
      {categories.map((category) => (
        <TouchableOpacity 
          key={category.id} 
          style={styles.categoryCard}
          onPress={() => console.log(`Category: ${category.name}`)}
        >
          <View style={styles.categoryIconContainer}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
          </View>
          <Text style={styles.categoryName}>{category.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

const renderProducts = (products: Product[], handleAddToCart: (productId: string) => void) => (
  <View style={styles.productsContainer}>
    <View style={[styles.sectionHeader, styles.productsHeader]}>
      <Text style={styles.sectionTitle}>Featured</Text>
      <TouchableOpacity onPress={() => router.push('/categories')}>
        <Text style={styles.seeAllText}>See All</Text>
      </TouchableOpacity>
    </View>
    
    <View style={styles.productsGrid}>
      {products.map((product) => (
        <TouchableOpacity
          key={product.id}
          style={styles.productCard}
          onPress={() => router.push(`/product/${product.id}`)}
        >
          <View style={styles.productCardInner}>
            <View style={styles.productImageContainer}>
              <Image 
                source={{ uri: product.image_url || 'https://via.placeholder.com/150' }} 
                style={styles.productImage} 
                resizeMode="cover"
              />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.productPrice}>
                {formatPrice(product.price)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart(product.id);
              }}
            >
              <Text style={styles.addToCartText}>+</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export default function HomeScreen() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // State for featured products
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Animation values for the product section
  const productSectionTranslateY = scrollY.interpolate({
    inputRange: [0, CATEGORIES_HEIGHT * 0.5, CATEGORIES_HEIGHT],
    outputRange: [0, -CATEGORIES_HEIGHT * 0.5, -CATEGORIES_HEIGHT],
    extrapolate: 'clamp',
  });
  
  // Animation for the product section border radius
  const productSectionBorderRadius = scrollY.interpolate({
    inputRange: [0, CATEGORIES_HEIGHT * 0.3, CATEGORIES_HEIGHT * 0.7],
    outputRange: [24, 12, 0],
    extrapolate: 'clamp',
  });
  
  // Animation for header
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, CATEGORIES_HEIGHT],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  // Animation for categories section
  const categoriesTranslateY = scrollY.interpolate({
    inputRange: [0, CATEGORIES_HEIGHT],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  // Animation for categories opacity
  const categoriesOpacity = scrollY.interpolate({
    inputRange: [0, CATEGORIES_HEIGHT * 0.7, CATEGORIES_HEIGHT],
    outputRange: [1, 0.7, 0.5],
    extrapolate: 'clamp',
  });
  
  // Animation for product section shadow
  const productSectionShadow = scrollY.interpolate({
    inputRange: [0, CATEGORIES_HEIGHT * 0.5],
    outputRange: [0, 12],
    extrapolate: 'clamp',
  });

  const fetchFeaturedProducts = useCallback(async () => {
    let isMounted = true;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)

      if (error) throw error;
      if (isMounted) {
        setFeaturedProducts(data || []);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId);
      // You might want to show a success message here
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Handle error (e.g., show error message)
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2D1B16" />
      </View>
    );
  }

  if (!user) {
    return (
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
        <View style={styles.authPrompt}>
          <Text style={styles.authTitle}>Welcome to Casa</Text>
          <Text style={styles.authSubtitle}>Sign in to explore our collection</Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.authButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Gradient (fixed) */}
      <Animated.View
        style={[
          styles.backgroundGradient, 
          { 
            height: TOP_SECTION_HEIGHT,
            transform: [{ translateY: headerTranslateY }]
          }
        ]}
      >
        <LinearGradient 
          colors={['#F5E6D3', '#E8D5C4']} 
          style={{ flex: 1 }} 
        />
      </Animated.View>
      
      {/* Fixed Header */}
      <Animated.View 
        style={[
          styles.headerContainer, 
          { 
            height: HEADER_HEIGHT,
            transform: [{ translateY: headerTranslateY }],
            zIndex: 30,
          }
        ]}
      >
        {renderHeader()}
      </Animated.View>
      
      {/* Fixed Categories Section */}
      {/* Categories Section (Behind Products) */}
      <Animated.View
        style={[
          styles.categoriesContainer, 
          { 
            height: CATEGORIES_HEIGHT,
            top: HEADER_HEIGHT,
            opacity: categoriesOpacity,
            transform: [{ translateY: categoriesTranslateY }],
            zIndex: 10, // Lower z-index to be behind products
          }
        ]}
      >
        {renderCategories()}
      </Animated.View>
      
      {/* Scrollable Product Section */}
      {/* Products Section (On Top) */}
      <Animated.ScrollView
        style={[
          styles.scrollView, 
          { 
            zIndex: 30, // Higher z-index to appear above categories
            transform: [{ translateY: productSectionTranslateY }],
          }
        ]}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingTop: CATEGORIES_HEIGHT + 20,
            paddingBottom: TAB_BAR_HEIGHT + 40,
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Section Background */}
        <Animated.View 
          style={[
            styles.productSectionBackground,
            {
              borderTopLeftRadius: productSectionBorderRadius,
              borderTopRightRadius: productSectionBorderRadius,
              shadowOpacity: productSectionShadow,
            }
          ]}
        >
          <View style={styles.contentContainer}>
            {renderProducts(featuredProducts, handleAddToCart)}
          </View>
        </Animated.View>
      </Animated.ScrollView>
      
      {/* Scroll Indicator */}
      <Animated.View 
        style={[
          styles.scrollIndicator,
          { 
            opacity: scrollY.interpolate({
              inputRange: [0, 50],
              outputRange: [1, 0],
              extrapolate: 'clamp',
            })
          }
        ]}
      >
        <ChevronDown size={20} color="#8B7355" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F0',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  productSectionBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 30, // Increased padding
    minHeight: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 15,
    shadowOpacity: 0.1,
    elevation: 15,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: HEADER_HEIGHT + CATEGORIES_HEIGHT - 50, // Higher overlap with categories
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    paddingBottom: 20,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: '#F8F5F0',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  greeting: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#2D1B16',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B7355',
    fontFamily: 'Inter-Regular',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F0E8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B47',
  },
  searchWrapper: {
    marginTop: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  searchPlaceholder: {
    marginLeft: 10,
    fontSize: 14,
    color: '#8B7355',
    fontFamily: 'Inter-Regular',
  },
  categoriesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: HEADER_HEIGHT,
    zIndex: 15,
    backgroundColor: '#F8F5F0',
    paddingBottom: 20,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  categoriesScrollContainer: {
    paddingRight: SCREEN_PADDING,
  },
  categoryCard: {
    width: 70,
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 12,
    color: '#2D1B16',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  contentContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 40,
    paddingTop: 10,
  },
  productsContainer: {
    paddingTop: 10,
  },
  productsHeader: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2D1B16',
  },
  seeAllText: {
    fontSize: 14,
    color: '#8B7355',
    fontFamily: 'Inter-Medium',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  productCard: {
    width: '48%',
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1B16',
    marginBottom: 8,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 4,
  },
  addToCartButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#2D1B16',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: -2,
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  authTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#8B7355',
    marginBottom: 32,
    textAlign: 'center',
  },
  authButton: {
    backgroundColor: '#2D1B16',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});