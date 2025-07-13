import React, { useState } from 'react';
import { Database } from '@/types/database';

type Product = Database['public']['Tables']['products']['Row'];
type CartItem = Database['public']['Tables']['cart_items']['Row'] & {
  products: Product;
};

type WishlistItem = Database['public']['Tables']['wishlist_items']['Row'] & {
  products: Product;
};
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, ShoppingCart, Heart, Plus, Minus, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/utils/format';

type TabType = 'cart' | 'wishlist';

const { width: screenWidth } = Dimensions.get('window');

export default function CartScreen() {
  const { user } = useAuth();
  const { 
    items: cartItems, 
    removeFromCart, 
    updateQuantity, 
    getTotalPrice, 
    getTotalItems,
    addToCart 
  } = useCart();
  
  const { 
    items: wishlistItems, 
    removeFromWishlist, 
    refreshWishlist 
  } = useWishlist();
  const [activeTab, setActiveTab] = useState<TabType>('cart');

  if (!user) {
    return (
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
        <View style={styles.authPrompt}>
          <Text style={styles.authTitle}>Sign in Required</Text>
          <Text style={styles.authSubtitle}>Please sign in to view your {activeTab}</Text>
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

  const renderEmptyState = (tab: TabType) => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        Your {tab} is empty
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'cart' 
          ? 'Add some items to get started!'
          : 'Save items you love to your wishlist!'}
      </Text>
      <TouchableOpacity 
        style={styles.continueShoppingButton}
        onPress={() => router.push('/')}
      >
        <Text style={styles.continueShoppingText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemImageContainer}>
        <Image 
          source={{ uri: item.products.image_url || 'https://via.placeholder.com/150' }} 
          style={styles.itemImage} 
          resizeMode="cover"
          defaultSource={{ uri: 'https://via.placeholder.com/150' }}
        />
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.products.name}
        </Text>
        <Text style={styles.itemPrice}>
          {formatPrice(item.products.price)}
        </Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
          >
            <Minus size={16} color="#2D1B16" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <Plus size={16} color="#2D1B16" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeFromCart(item.id)}
      >
        <Trash2 size={20} color="#E74C3C" />
      </TouchableOpacity>
    </View>
  );

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemImageContainer}>
        <Image 
          source={{ uri: item.products.image_url || 'https://via.placeholder.com/150' }} 
          style={styles.itemImage} 
          resizeMode="cover"
          defaultSource={{ uri: 'https://via.placeholder.com/150' }}
        />
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.products.name}
        </Text>
        <Text style={styles.itemPrice}>
          {formatPrice(item.products.price)}
        </Text>
        <View style={styles.wishlistButtons}>
          <TouchableOpacity 
            style={styles.addToCartButton}
            onPress={async () => {
              await addToCart(item.products.id, 1);
              await removeFromWishlist(item.products.id);
              await refreshWishlist();
            }}
          >
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeFromWishlist(item.products.id)}
      >
        <Trash2 size={20} color="#E74C3C" />
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#2D1B16" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {activeTab === 'cart' ? 'My Cart' : 'Wishlist'}
          {activeTab === 'cart' && cartItems.length > 0 && (
            <Text style={styles.itemCount}> ({getTotalItems()})</Text>
          )}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cart' && styles.activeTab]}
          onPress={() => setActiveTab('cart')}
        >
          <ShoppingCart size={20} color={activeTab === 'cart' ? '#2D1B16' : '#8B7355'} />
          <Text style={[styles.tabText, activeTab === 'cart' && styles.activeTabText]}>
            Cart {cartItems.length > 0 && `(${cartItems.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wishlist' && styles.activeTab]}
          onPress={() => setActiveTab('wishlist')}
        >
          <Heart size={20} color={activeTab === 'wishlist' ? '#2D1B16' : '#8B7355'} />
          <Text style={[styles.tabText, activeTab === 'wishlist' && styles.activeTabText]}>
            Wishlist {wishlistItems.length > 0 && `(${wishlistItems.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'cart' ? (
          cartItems.length === 0 ? (
            renderEmptyState('cart')
          ) : (
            <>
              <FlatList
                data={cartItems}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
              <View style={styles.footer}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalPrice}>{formatPrice(getTotalPrice())}</Text>
                </View>
                <TouchableOpacity style={styles.checkoutButton}>
                  <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                </TouchableOpacity>
              </View>
            </>
          )
        ) : wishlistItems.length === 0 ? (
          renderEmptyState('wishlist')
        ) : (
          <FlatList
            data={wishlistItems}
            renderItem={renderWishlistItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 10,
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
  itemCount: {
    fontSize: 16,
    color: '#8B7355',
    marginLeft: 4,
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    marginLeft: 6,
    color: '#8B7355',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2D1B16',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listContent: {
    paddingBottom: 100,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F8F8',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D1B16',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    padding: 4,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    width: 30,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
  },
  wishlistButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  addToCartButton: {
    backgroundColor: '#2D1B16',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addToCartText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#8B7355',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D1B16',
  },
  checkoutButton: {
    backgroundColor: '#2D1B16',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 24,
  },
  continueShoppingButton: {
    backgroundColor: '#2D1B16',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  continueShoppingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 24,
  },
  authButton: {
    backgroundColor: '#2D1B16',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
