import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Animated, 
  Easing 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';

type FilterOption = {
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  minRating?: number;
};

type Category = {
  id: string;
  name: string;
  icon: string;
  children?: Category[];
};

type SortOption = {
  id: string;
  label: string;
  value: string;
};

const BRANDS = ['IKEA', 'West Elm', 'Ashley', 'Article', 'Wayfair'];

const SORT_OPTIONS: SortOption[] = [
  { id: 'newest', label: 'Newest', value: 'created_at.desc' },
  { id: 'price_asc', label: 'Price: Low to High', value: 'price.asc' },
  { id: 'price_desc', label: 'Price: High to Low', value: 'price.desc' },
  { id: 'name_asc', label: 'Name: A to Z', value: 'name.asc' },
  { id: 'name_desc', label: 'Name: Z to A', value: 'name.desc' },
];

const CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Living Room',
    icon: 'weekend',
    children: [
      { id: '1-1', name: 'Sofas', icon: 'weekend' },
      { id: '1-2', name: 'Sectionals', icon: 'weekend' },
      { id: '1-3', name: 'Loveseats', icon: 'weekend' },
      { id: '1-4', name: 'Coffee Tables', icon: 'coffee' },
    ],
  },
  {
    id: '2',
    name: 'Bedroom',
    icon: 'bed',
    children: [
      { id: '2-1', name: 'Beds', icon: 'bed' },
      { id: '2-2', name: 'Dressers', icon: 'dresser' },
      { id: '2-3', name: 'Nightstands', icon: 'nightstand' },
    ],
  },
  {
    id: '3',
    name: 'Dining',
    icon: 'dining',
    children: [
      { id: '3-1', name: 'Dining Tables', icon: 'table-restaurant' },
      { id: '3-2', name: 'Chairs', icon: 'chair' },
      { id: '3-3', name: 'Bar Stools', icon: 'bar-stool' },
    ],
  },
];

interface SideMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onSortChange: (sortBy: string) => void;
  onCategorySelect: (categoryId: string) => void;
  selectedCategory?: string;
}

const SideMenu: React.FC<SideMenuProps> = ({
  isVisible,
  onClose,
  onSortChange,
  onCategorySelect,
  selectedCategory,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<FilterOption>({});
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Handle menu visibility with animation
  useEffect(() => {
    if (isVisible) {
      // Reset animations
      slideAnim.setValue(-300);
      opacityAnim.setValue(0);
      
      // Start animations
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleCategoryPress = (categoryId: string) => {
    onCategorySelect(categoryId);
    onClose();
  };

  const handleBrandPress = (brand: string) => {
    setFilters(prev => ({ ...prev, brands: prev.brands ? [...prev.brands, brand] : [brand] }));
  };

  const handleRatingPress = (rating: number) => {
    setFilters(prev => ({ ...prev, minRating: rating }));
  };

  return (
    <Animated.View 
      style={[
        styles.overlay, 
        { 
          opacity: opacityAnim,
          display: isVisible ? 'flex' : 'none',
        }
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <TouchableOpacity 
        style={styles.overlayTouchable} 
        onPress={onClose}
        activeOpacity={1}
      />
      <Animated.View 
        style={[
          styles.container,
          { 
            transform: [{ translateX: slideAnim }],
          }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>Filters</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={theme.colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={theme.colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            {CATEGORIES.map(category => (
              <View key={category.id}>
                <TouchableOpacity 
                  style={styles.categoryItem}
                  onPress={() => toggleCategory(category.id)}
                >
                  <MaterialIcons 
                    name={expandedCategories[category.id] ? 'keyboard-arrow-down' : 'keyboard-arrow-right'} 
                    size={24} 
                    color={theme.colors.text} 
                  />
                  <Text style={styles.categoryText}>{category.name}</Text>
                </TouchableOpacity>
                
                {expandedCategories[category.id] && category.children?.map(child => (
                  <TouchableOpacity 
                    key={child.id}
                    style={[styles.subcategoryItem, selectedCategory === child.id && styles.selectedSubcategory]}
                    onPress={() => handleCategoryPress(child.id)}
                  >
                    <Text style={styles.subcategoryText}>{child.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.sliderContainer}>
              <Text>₹{priceRange[0]}</Text>
              <View style={styles.sliderTrack}>
                <View style={styles.sliderFill} />
              </View>
              <Text>₹{priceRange[1]}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Brands</Text>
            {BRANDS.map((brand) => (
              <TouchableOpacity 
                key={brand}
                style={styles.filterItem}
                onPress={() => handleBrandPress(brand)}
              >
                <Text style={styles.filterText}>{brand}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minimum Rating</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => handleRatingPress(star)}>
                  <MaterialIcons 
                    name={filters.minRating && star <= filters.minRating ? 'star' : 'star-border'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity 
                key={option.id}
                style={styles.sortItem}
                onPress={() => onSortChange(option.value)}
              >
                <Text style={styles.sortText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={onClose}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    elevation: 5,
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '85%',
    maxWidth: 320,
    backgroundColor: theme.colors.background,
    paddingTop: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: theme.colors.text,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 8,
  },
  subcategoryItem: {
    paddingVertical: 8,
    paddingLeft: 32,
    marginLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
  },
  selectedSubcategory: {
    backgroundColor: 'rgba(1, 160, 152, 0.1)',
    borderLeftColor: theme.colors.primary,
  },
  subcategoryText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  sortItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sortText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  filterItem: {
    paddingVertical: 8,
  },
  filterText: {
    color: theme.colors.text,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
  },
  sliderFill: {
    height: '100%',
    width: '50%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  footer: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SideMenu;
