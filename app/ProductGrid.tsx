import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Star, ShoppingCart } from 'lucide-react-native';
import { router } from 'expo-router';
import { formatPrice } from '@/utils/format';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price?: number | null;
  rating?: number | null;
  image_url?: string | null;
};

interface ProductGridProps {
  products: Product[];
  onAddToCart: (productId: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (screenWidth - 120) / 2; // Two cards per row with margins

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart }) => {
  return (
    <View style={styles.productsGrid}>
      {products.map((product) => (
        <TouchableOpacity
          key={product.id}
          style={styles.productCard}
          onPress={() => router.push(`/product/${product.id}`)}
        >
          <BlurView intensity={40} style={styles.productCardInner}>
            <View style={styles.productImageContainer}>
              <Image 
                source={{ uri: product.image_url || require('@/assets/images/placeholder').placeholderImageBase64 }} 
                style={styles.productImage} 
              />
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
                {product.description || 'No description available'}
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
                    onAddToCart(product.id);
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
  );
};

const styles = StyleSheet.create({
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  productCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productCardInner: {
    flex: 1,
    padding: 12,
  },
  productImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F5F0E8',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B47',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
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
  },
  productDescription: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
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

export default ProductGrid;