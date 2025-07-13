import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Search, Star, X, ShoppingCart } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

type Product = Database['public']['Tables']['products']['Row'];

const { width: screenWidth } = Dimensions.get('window');

export default function SearchScreen() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      searchProducts();
    } else {
      setProducts([]);
    }
  }, [searchQuery]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('in_stock', true)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const updatedSearches = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(updatedSearches);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setProducts([]);
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
        <BlurView intensity={40} style={styles.searchBar}>
          <Search size={18} color="#8B7355" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search furniture..."
            placeholderTextColor="#8B7355"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <X size={18} color="#8B7355" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </BlurView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Recent Searches */}
        {recentSearches.length > 0 && searchQuery.length === 0 && (
          <View style={styles.recentContainer}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <View style={styles.recentSearches}>
              {recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentItem}
                  onPress={() => setSearchQuery(search)}
                >
                  <BlurView intensity={30} style={styles.recentItemInner}>
                    <Text style={styles.recentText}>{search}</Text>
                  </BlurView>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Search Results */}
        {products.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>
              {products.length} result{products.length !== 1 ? 's' : ''} for "{searchQuery}"
            </Text>
            <View style={styles.productsGrid}>
              {products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => router.push(`/product/${product.id}`)}
                >
                  <BlurView intensity={40} style={styles.productCardInner}>
                    <View style={styles.productImageContainer}>
                      <Image source={{ uri: product.image_url }} style={styles.productImage} />
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
                          <Text style={styles.productPrice}>${product.price}</Text>
                          {product.original_price && product.original_price > product.price && (
                            <Text style={styles.originalPrice}>${product.original_price}</Text>
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
          </View>
        )}

        {/* No Results */}
        {searchQuery.length > 2 && products.length === 0 && !loading && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsTitle}>No results found</Text>
            <Text style={styles.noResultsText}>
              Try searching with different keywords or browse our categories
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/categories')}
            >
              <Text style={styles.browseButtonText}>Browse Categories</Text>
            </TouchableOpacity>
          </View>
        )}

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
    marginRight: 12,
  },
  searchBar: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  recentContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 16,
  },
  recentSearches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recentItem: {
    marginRight: 12,
    marginBottom: 12,
  },
  recentItemInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  recentText: {
    fontSize: 14,
    color: '#2D1B16',
  },
  resultsContainer: {
    paddingHorizontal: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (screenWidth - 50) / 2,
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
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  noResultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: '#2D1B16',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});