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
import { Search, Bell, ChevronDown } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ProductGrid } from './ProductGrid';

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
  { id: 'all', name: 'All', icon: '📦' },
  { id: 'chairs', name: 'Chairs', icon: '🪑' },
  { id: 'tables', name: 'Tables', icon: '🪵' },
  { id: 'sofas', name: 'Sofas', icon: '🛋️' },
  { id: 'beds', name: 'Beds', icon: '🛏️' },
  { id: 'lamps', name: 'Lamps', icon: '💡' },
  { id: 'decor', name: 'Decor', icon: '🖼️' },
  { id: 'storage', name: 'Storage', icon: '🗄️' },
];

// Layout constants
const HEADER_HEIGHT = Platform.OS === 'ios' ? 80 : 80; // Reduced from 100 to 80
const CATEGORIES_HEIGHT = 160;
const TAB_BAR_HEIGHT = 60;
const SCREEN_PADDING = 16;
const TOP_SECTION_HEIGHT = HEADER_HEIGHT + CATEGORIES_HEIGHT;

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
          <Text style={styles.title}>Casa</Text>
          <View style={styles.notificationButton}>
            <Bell size={22} color="#2D1B16" strokeWidth={2} />
            <View style={styles.notificationDot} />
          </View>
        </View>
        <Text style={styles.subtitle}>Beautiful furniture for your home</Text>
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
          <Search size={18} color="#8B7355" strokeWidth={2} />
          <Text style={styles.searchPlaceholder}>Search furniture, decor, and more</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  </View>
);


const renderCategories = () => {
  // Split categories into two rows
  const firstRow = categories.slice(0, 4);
  const secondRow = categories.slice(4, 8);

  return (
    <View style={styles.categoriesContainer}>
      <View style={styles.sectionHeader}>
        {/* <Text style={styles.sectionTitle}>Shop by Category</Text> */}
        {/* <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity> */}
      </View>
      <View style={styles.categoriesGrid}>
        {/* First Row */}
        <View style={styles.categoryRow}>
          {firstRow.map((category) => (
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
        </View>
        {/* Second Row */}
        <View style={styles.categoryRow}>
          {secondRow.map((category) => (
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
        </View>
      </View>
    </View>
  );
};


export default function HomeScreen() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // State for featured products
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
  
  // Animation for search bar - smoother transitions
  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.4, HEADER_HEIGHT, HEADER_HEIGHT + 50],
    outputRange: [0, -HEADER_HEIGHT * 0.3, -HEADER_HEIGHT + 70, -HEADER_HEIGHT + 70],
    extrapolate: 'clamp',
  });
  
  const searchBarOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.3, HEADER_HEIGHT * 0.7, HEADER_HEIGHT],
    outputRange: [0, 0.3, 0.8, 1],
    extrapolate: 'clamp',
  });
  
  const searchBarScale = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.3, HEADER_HEIGHT * 0.7, HEADER_HEIGHT],
    outputRange: [0.95, 0.97, 0.99, 1],
    extrapolate: 'clamp',
  });
  
  const originalSearchBarOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.2, HEADER_HEIGHT * 0.4],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });
  
  // Animation for header content opacity - hide when scrolled
  const headerContentOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.2, HEADER_HEIGHT * 0.4],
    outputRange: [1, 0.5, 0],
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
  
  // Animation for original search bar opacity is defined above
  
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
  
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(6)

      if (error) throw error;
      setProducts(data || []);
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
            <Search size={18} color="#8B7355" strokeWidth={2} />
            <Text style={styles.searchPlaceholder}>Search furniture, decor, and more</Text>
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
          { height: TOP_SECTION_HEIGHT },
        ]}
      >
        <LinearGradient 
          colors={['#eeddcb', '#eeddcb']} 
          style={{ height: '100%', width: '100%' }} 
        />
      </Animated.View>
      
      {/* Categories Section */}
      <Animated.View 
        style={[
          styles.categoriesContainer,
          { 
            transform: [{ translateY: categoriesTranslateY }],
            opacity: categoriesOpacity,
          }
        ]}
      >
        {renderCategories()}
      </Animated.View>
      
      {/* Categories Section is now only rendered once above */}
      
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
            minHeight: Dimensions.get('window').height - (HEADER_HEIGHT + TAB_BAR_HEIGHT),
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
          {/* Glassmorphism effect with BlurView */}
          <BlurView 
            intensity={25} 
            tint="light" 
            style={styles.glassmorphismEffect}
          />
          {/* Content container positioned on top of the blur */}
          <View style={styles.contentContainer}>
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
    zIndex: 1,
  },
  productSectionBackground: {
    backgroundColor: '#eeddcb', // Much more transparent background for glassmorphism
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 30, // Increased padding
    minHeight: Dimensions.get('window').height - (TAB_BAR_HEIGHT + 20), // Full screen height minus tab bar
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: -4 },
    // shadowRadius: 15,
    // shadowOpacity: 0.1,
    // elevation: 15,
    overflow: 'hidden', // Ensure the blur doesn't extend beyond borders
    position: 'relative', // To properly position children elements
  },
  glassmorphismEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // backgroundColor: 'rgba(255, 255, 255, 0.05)', // Even more subtle white overlay for increased transparency
    // backdropFilter is for web only, BlurView handles this in native
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: HEADER_HEIGHT + CATEGORIES_HEIGHT - 10, // Moved down by increasing the top position
    left: 0,
    right: 0,
    bottom: TAB_BAR_HEIGHT,
    zIndex: 20,
    height: Dimensions.get('window').height - (HEADER_HEIGHT + TAB_BAR_HEIGHT - 90),
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    paddingBottom: TAB_BAR_HEIGHT + 20,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: '#eeddcb',
    paddingTop: Platform.OS === 'ios' ? 45 : 25, // Reduced top padding
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 15, // Reduced bottom padding
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
    color: '#8B7355',
    marginBottom: 2, // Reduced margin
    fontFamily: 'Inter-Medium',
  },
  title: {
    fontSize: 28, // Reduced font size
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
  floatingSearchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: SCREEN_PADDING,
    right: SCREEN_PADDING,
    zIndex: 30,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 5,
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingBottom: 20,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 35,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
   
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
    paddingBottom: 10,
    // paddingTop: 1,
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