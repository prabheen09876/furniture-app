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
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Search, Bell, ChevronDown, Maximize } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ProductGrid } from './ProductGrid';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import BannerCarousel from '@/components/BannerCarousel';
import theme from '@/lib/theme';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  category: string;
  is_active: boolean;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
};

const { width: screenWidth } = Dimensions.get('window');

// Layout constants
const HEADER_HEIGHT = Platform.OS === 'ios' ? 120 : 100; // Increased base height to capture content vertically
const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 45 : 25;
const HEADER_PADDING_BOTTOM = 15;
const ACTUAL_HEADER_HEIGHT = HEADER_HEIGHT + HEADER_PADDING_TOP + HEADER_PADDING_BOTTOM;
const CATEGORIES_HEIGHT = 0; // Set to 0 since we removed categories
const TAB_BAR_HEIGHT = 60;
const SCREEN_PADDING = 16;
const TOP_SECTION_HEIGHT = ACTUAL_HEADER_HEIGHT + 20; // Just header plus a bit of padding

// Define category type
interface Category {
  id: string;
  name: string;
  icon?: string;
  slug: string;
  icon_url?: string;
}

export default function HomeScreen() {
  const { user, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const scrollY = useRef(new Animated.Value(0)).current;

  // State for categories
  const [categories, setCategories] = useState<Category[]>([]);
  // State for featured products
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Removed productSectionTranslateY to fix jitter

  // Animation for the product section border radius
  const productSectionBorderRadius = scrollY.interpolate({
    inputRange: [0, CATEGORIES_HEIGHT * 0.3, CATEGORIES_HEIGHT * 0.7],
    outputRange: [24, 12, 0],
    extrapolate: 'clamp',
  });

  // Animation for header
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -120], // Move header up significantly to hide it
    extrapolate: 'clamp',
  });

  // Animation for search bar - smoother transitions
  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.4, HEADER_HEIGHT, HEADER_HEIGHT + 80],
    outputRange: [0, -HEADER_HEIGHT * 0.3, -HEADER_HEIGHT + 70, -HEADER_HEIGHT + 90],
    extrapolate: 'clamp',
  });

  const searchBarOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT * 0.7, HEADER_HEIGHT * 0.9, HEADER_HEIGHT + 20], // Delayed appearance
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const searchBarScale = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.3, HEADER_HEIGHT * 0.7, HEADER_HEIGHT],
    outputRange: [0.8, 0.9, 0.95, 1],
    extrapolate: 'clamp',
  });

  const originalSearchBarOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.5, HEADER_HEIGHT],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const headerContentOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.2, HEADER_HEIGHT * 0.5],
    outputRange: [1, 0.5, 0], // Fade out completely before search bar appears
    extrapolate: 'clamp',
  });

  // Removed complex category opacity/translate animations

  // Animation for product section shadow
  const productSectionShadow = scrollY.interpolate({
    inputRange: [0, CATEGORIES_HEIGHT * 0.5],
    outputRange: [0, 0.12],
    extrapolate: 'clamp',
  });

  // Fetch categories from the database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Define the type for category data from database
        type DBCategory = {
          id: string;
          name: string;
          slug: string;
          icon_url?: string;
        };

        // Try to fetch categories with icon_url first
        const response = await supabase
          .from('categories')
          .select('id, name, slug, icon_url')
          .eq('is_active', true)
          .order('sort_order');

        // If there's an error or no data, use default categories
        if (response.error || !response.data || response.data.length === 0) {
          console.log('Error or no categories found, using defaults');
          if (response.error) console.error(response.error);
          useDefaultCategories();
          return;
        }

        // Safely cast the data to the expected type
        // First assert to unknown, then to our expected type to avoid TypeScript errors
        const data = (response.data as unknown) as DBCategory[];

        // Map database categories to the format expected by the UI
        const mappedCategories: Category[] = data.map(cat => ({
          id: cat.slug, // Use slug as ID for routing
          name: cat.name,
          icon_url: cat.icon_url,
          slug: cat.slug
        }));

        setCategories(mappedCategories);
      } catch (err) {
        console.error('Error in fetchCategories:', err);
        // Fallback to default categories
        useDefaultCategories();
      }
    };

    // Helper function for default categories
    const useDefaultCategories = () => {
      const defaultCategories: Category[] = [
        { id: 'all', name: 'All', slug: 'all', icon: '🏠' },
        { id: 'chairs', name: 'Chairs', slug: 'chairs', icon: '🪑' },
        { id: 'tables', name: 'Tables', slug: 'tables', icon: '🪵' },
        { id: 'sofas', name: 'Sofas', slug: 'sofas', icon: '🛋️' },
        { id: 'beds', name: 'Beds', slug: 'beds', icon: '🛏️' },
        { id: 'lamps', name: 'Lamps', slug: 'lamps', icon: '💡' },
        { id: 'decor', name: 'Decor', slug: 'decor', icon: '🖼️' },
        { id: 'storage', name: 'Storage', slug: 'storage', icon: '📦' },
      ];
      setCategories(defaultCategories);
    };

    fetchCategories();
  }, []);

  const renderCategories = () => {
    // Ensure we have categories before rendering
    if (!categories || categories.length === 0) {
      return null;
    }

    // Safely slice the array to prevent errors
    const firstRow = categories.slice(0, Math.min(4, categories.length));
    const secondRow = categories.slice(4, Math.min(8, categories.length));

    // Helper function to render a single category
    const renderCategory = (category: Category) => (
      <TouchableOpacity
        key={category.id}
        style={styles.categoryCard}
        onPress={() => router.push(`/categories?filter=${category.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryIconContainer}>
          {category.icon_url ? (
            <Image
              source={{ uri: category.icon_url }}
              style={styles.categoryIconImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.categoryIcon}>{category.icon || '📦'}</Text>
          )}
        </View>
        <Text style={styles.categoryName}>{category.name}</Text>
      </TouchableOpacity>
    );

    return (
      <View style={styles.categoriesContainer}>
        <View style={styles.categoryRow}>
          {firstRow.map(renderCategory)}
        </View>
        {secondRow.length > 0 && (
          <View style={styles.categoryRow}>
            {secondRow.map(renderCategory)}
          </View>
        )}
      </View>
    );
  };

  const getGreeting = () => {
    const currentHour = new Date().getHours();

    if (currentHour >= 5 && currentHour < 12) {
      return 'Good Morning';
    } else if (currentHour >= 12 && currentHour < 17) {
      return 'Good Afternoon';
    } else if (currentHour >= 17 && currentHour < 21) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  };

  const renderHeader = (originalSearchBarOpacity: Animated.AnimatedInterpolation<number>, headerContentOpacity: Animated.AnimatedInterpolation<number>) => (
    <View style={styles.headerContainer}>
      <Animated.View style={[styles.header, { opacity: headerContentOpacity }]}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Kesarwala</Text>
            {!isAdmin && (
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => router.push('/notifications')}
                activeOpacity={0.7}
              >
                <Bell size={22} color={theme.colors.text} strokeWidth={2} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.subtitle}>Premium Indian Sweets</Text>
        </View>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View style={[
        styles.searchWrapper,
        { opacity: originalSearchBarOpacity }
      ]}>
        <TouchableOpacity
          onPress={() => router.push('/search')}
          activeOpacity={0.8}
        >
          <View style={styles.searchContainer}>
            <Search size={18} color={theme.colors.primary} strokeWidth={2} />
            <Text style={styles.searchPlaceholder}>Search...</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  const fetchFeaturedProducts = useCallback(async () => {
    let isMounted = true;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)

      if (error) throw error;
      if (isMounted) {
        // Ensure the product data matches our expected type
        const productsData = (data || []).map(product => ({
          ...product,
          rating: (product as any).rating || null
        })) as Product[];
        setFeaturedProducts(productsData);
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

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(6)

      if (error) throw error;
      // Ensure the product data matches our expected type
      const productsData = (data || []).map(product => ({
        ...product,
        rating: (product as any).rating || null
      })) as Product[];
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedProducts();
    // Also set the products state with the same data
    fetchProducts();
  }, [fetchFeaturedProducts]);

  const handleAddToCart = async (productId: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }

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
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2D1B16" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
        <View style={styles.authPrompt}>
          <Text style={styles.authTitle}>Welcome to Kesarwala</Text>
          <Text style={styles.authSubtitle}>Sign in to explore our premium sweets</Text>
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#eeddcb" />

      {/* Floating Search Bar that appears when scrolling */}
      <Animated.View
        style={[
          styles.floatingSearchContainer,
          {
            transform: [{ translateY: searchBarTranslateY }, { scale: searchBarScale }],
            opacity: searchBarOpacity,
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => router.push('/search')}
          activeOpacity={0.8}
          style={{ width: '100%' }}
        >
          <View style={styles.searchContainer}>
            <Search size={18} color={theme.colors.primary} strokeWidth={2} />
            <Text style={styles.searchPlaceholder}>Search...</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Header */}
      <Animated.View
        style={[
          styles.headerContainer,
          { transform: [{ translateY: headerTranslateY }] }
        ]}
      >
        {renderHeader(originalSearchBarOpacity, headerContentOpacity)}
      </Animated.View>

      {/* Background Gradient (fixed) */}
      <Animated.View
        style={[
          styles.backgroundGradient,
          { height: TOP_SECTION_HEIGHT + 100 }, // Extend background further down
        ]}
      >
        <LinearGradient
          colors={['#eeddcb', '#eeddcb']}
          style={{ height: '100%', width: '100%' }}
        />
      </Animated.View>

      {/* Scrollable Main Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: ACTUAL_HEADER_HEIGHT + 100 }} />

        {/* Categories Section Removed */}


        {/* Banner Carousel Section */}
        <View style={styles.bannerSection}>
          <BannerCarousel autoPlay={true} autoPlayInterval={4000} />
        </View>

        {/* Product Section Background */}
        <View style={styles.productSectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity onPress={() => router.push('/categories')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ProductGrid
            products={products}
            onAddToCart={handleAddToCart}
          />
        </View>
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
        <ChevronDown size={20} color="#000000" />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eeddcb',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0, // Make it cover full screen
    zIndex: -1, // Put it behind everything
  },
  // Styles removed
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: TAB_BAR_HEIGHT + 20,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: '#eeddcb',
    paddingTop: Platform.OS === 'ios' ? 55 : 35, // Increased padding top
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 20, // Increased bottom padding
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    // shadowColor: 'rgba(0,0,0,0.1)',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 1,
    // shadowRadius: 8,
    // elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10, // Reduced margin
  },
  greeting: {
    fontSize: 13, // Reduced font size
    color: theme.colors.textLight,
    marginBottom: 2, // Reduced margin
    fontFamily: 'Inter-Medium',
  },
  title: {
    fontSize: 28, // Reduced font size
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontFamily: 'Inter-Regular',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F0E8',
    marginHorizontal: 200,
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
    backgroundColor: theme.colors.primary,
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
  floatingSearchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: SCREEN_PADDING,
    right: SCREEN_PADDING,
    zIndex: 30,
    backgroundColor: '#eeddcb', // Match header background
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  searchPlaceholder: {
    marginLeft: 10,
    fontSize: 14,
    color: '#8B7355',
    fontFamily: 'Inter-Regular',
  },
  categoriesContainer: {
    marginTop: 10,
    paddingHorizontal: SCREEN_PADDING,
    marginBottom: 20,
  },
  bannerSection: {
    marginBottom: 25,
    marginTop: 10,
  },
  categoriesScrollContainer: {
    paddingRight: SCREEN_PADDING,
  },
  categoriesGrid: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryCard: {
    width: 70,
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#fde3c5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryIconImage: {
    width: 36,
    height: 36,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: '#2D1B16',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  productSectionContainer: {
    backgroundColor: '#FDF6EE', // Warm white/cream background
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 20,
    marginTop: 0, // Reduced margin
    minHeight: 500, // Ensure it fills some space
  },
  // Removed old productSectionBackground and glassmorphismEffect styles as they are replaced by simple container
  contentContainer: {
    // Legacy support if needed, or remove
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
    marginBottom: 18,
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
    // backgroundColor: '#',
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
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
    backgroundColor: 'transparent',
    elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
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
    fontFamily: 'Inter-Bold',
    color: '#2D1B16',
    marginBottom: 8,
    textAlign: 'center',
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