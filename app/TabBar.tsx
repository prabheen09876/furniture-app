import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import theme from './theme';
import { useCart } from '../contexts/CartContext';

type TabBarItemProps = {
  icon?: string;
  isActive: boolean;
  onPress: () => void;
  label: string;
  isSearch?: boolean;
};

const TabBarItem = ({ icon, isActive, onPress, label, isSearch, badgeCount }: TabBarItemProps & { badgeCount?: number }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.tabItem,
      isSearch && styles.searchTabItem,
      isActive && !isSearch && styles.activeTabItem,
    ]}
    activeOpacity={0.7}
    accessibilityState={{ selected: isActive }}
    accessibilityLabel={label}
  >
    {isSearch ? (
      <View style={styles.searchButton}>
        <MaterialIcons name="search" size={24} color="#FFFFFF" />
      </View>
    ) : (
      <View style={styles.tabContent}>
        <Ionicons
          name={icon as any}
          size={26} /* Slightly larger icons since we removed text */
          color={isActive ? theme.colors.primary : theme.colors.textLight}
          style={styles.icon}
        />
        {badgeCount && badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
          </View>
        )}
      </View>
    )}
  </TouchableOpacity>
);

type TabBarProps = {
  onSearchPress: () => void;
};

const TabBar = ({ onSearchPress }: TabBarProps) => {
  const pathname = usePathname();
  const route = pathname === '/' ? 'home' : pathname.replace(/^\//, '').split('/')[0];
  const activeTab = route === 'cart' ? 'cart' : route === 'profile' ? 'profile' : route === 'categories' ? 'categories' : route;
  const { items } = useCart();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const tabs = [
    { id: 'home', icon: 'home-outline', label: 'Home', isSearch: false, route: '/' },
    { id: 'categories', icon: 'grid-outline', label: 'Categories', isSearch: false, route: '/categories' },
    { id: 'search', icon: 'search', label: 'Search', isSearch: true },
    { id: 'cart', icon: 'cart-outline', label: 'Cart', isSearch: false, route: '/cart', badge: cartItemCount },
    { id: 'profile', icon: 'person-outline', label: 'Profile', isSearch: false, route: '/profile' },
  ] as const;

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TabBarItem
            key={tab.id}
            icon={tab.id === 'search' ? 'search' : tab.icon}
            isActive={activeTab === tab.id}
            onPress={tab.isSearch ? onSearchPress : () => router.replace(tab.route)}
            label={tab.label}
            isSearch={tab.isSearch}
            badgeCount={'badge' in tab ? tab.badge : undefined}
          />
        ))}
      </View>
    </View>
  );
};

export default TabBar;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.69)', // Semi-transparent background
    borderRadius: 30, // More rounded for a more compact look
    paddingVertical: 12, // Adjusted padding for icon-only layout
    zIndex: 1000, // Very high z-index to float above everything
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.15,
    // shadowRadius: 12,
    // elevation: 10,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4, // Reduced vertical padding for icon-only layout
    position: 'relative',
    minWidth: 50, // Adjusted width for better spacing
    maxWidth: 60, // More compact max width
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchTabItem: {
    flex: 1,
    paddingHorizontal: 0,
  },
  activeTabItem: {
    // Add any active tab styling if needed
  },
  icon: {
    // No margin needed since we removed labels
  },
  // Removed tabLabel and activeTabLabel styles as they're no longer needed
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -5, // Reduced margin since we have a more compact layout
    elevation: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B47',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});