import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';

type TabBarItemProps = {
  icon?: string;
  isActive: boolean;
  onPress: () => void;
  label: string;
  isSearch?: boolean;
};

const TabBarItem = ({ icon, isActive, onPress, label, isSearch }: TabBarItemProps) => (
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
          size={24}
          color={isActive ? theme.colors.primary : theme.colors.textLight}
          style={styles.icon}
        />
        <Text style={[
          styles.tabLabel,
          isActive && styles.activeTabLabel
        ]}>
          {label}
        </Text>
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
  const activeTab = route === 'cart' ? 'cart' : route === 'profile' ? 'profile' : route;
  
  const tabs = [
    { id: 'home', icon: 'home-outline', label: 'Home', isSearch: false, route: '/' },
    { id: 'categories', icon: 'grid-outline', label: 'Categories', isSearch: false, route: '/categories' },
    { id: 'search', icon: 'search', label: 'Search', isSearch: true },
    { id: 'cart', icon: 'cart-outline', label: 'Cart', isSearch: false, route: '/cart' },
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
          />
        ))}
      </View>
    </View>
  );
};

export default TabBar;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: 8,
    paddingTop: 8,
    position: 'relative',
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
    paddingVertical: 8,
    position: 'relative',
    minWidth: 40, // Reduced minWidth to fit 5 tabs
    maxWidth: 80, // Limit max width for better spacing
  },
  tabContent: {
    alignItems: 'center',
  },
  searchTabItem: {
    flex: 1,
    paddingHorizontal: 0,
  },
  activeTabItem: {
    // Add any active tab styling if needed
  },
  icon: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  activeTabLabel: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  searchButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -24,
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});