import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';

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

const SORT_OPTIONS: SortOption[] = [
  { id: 'newest', label: 'Newest', value: 'created_at.desc' },
  { id: 'price_asc', label: 'Price: Low to High', value: 'price.asc' },
  { id: 'price_desc', label: 'Price: High to Low', value: 'price.desc' },
  { id: 'name_asc', label: 'Name: A to Z', value: 'name.asc' },
  { id: 'name_desc', label: 'Name: Z to A', value: 'name.desc' },
];

// Sample category data - replace with your actual categories
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
    icon: 'king-bed',
    children: [
      { id: '2-1', name: 'Beds', icon: 'king-bed' },
      { id: '2-2', name: 'Dressers', icon: 'dresser' },
      { id: '2-3', name: 'Nightstands', icon: 'night-shelves' },
    ],
  },
  {
    id: '3',
    name: 'Dining',
    icon: 'dining',
    children: [
      { id: '3-1', name: 'Dining Tables', icon: 'dining' },
      { id: '3-2', name: 'Dining Chairs', icon: 'chair' },
      { id: '3-3', name: 'Bar Stools', icon: 'chair-rolling' },
    ],
  },
  {
    id: '4',
    name: 'Office',
    icon: 'work',
    children: [
      { id: '4-1', name: 'Desks', icon: 'desk' },
      { id: '4-2', name: 'Office Chairs', icon: 'chair' },
      { id: '4-3', name: 'Bookshelves', icon: 'menu-book' },
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
  const [searchQuery, setSearchQuery] = useState('');

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

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
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
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.id && styles.selectedCategory
                  ]}
                  onPress={() => handleCategoryPress(category.id)}
                >
                  <MaterialIcons
                    name={category.icon as any}
                    size={20}
                    color={selectedCategory === category.id ? theme.colors.primary : theme.colors.text}
                    style={styles.categoryIcon}
                  />
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.selectedCategoryText
                  ]}>
                    {category.name}
                  </Text>
                  {category.children && (
                    <MaterialIcons
                      name={expandedCategories[category.id] ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                      size={20}
                      color={theme.colors.textLight}
                      style={styles.arrowIcon}
                      onPress={() => toggleCategory(category.id)}
                    />
                  )}
                </TouchableOpacity>
                
                {expandedCategories[category.id] && category.children?.map(child => (
                  <TouchableOpacity
                    key={child.id}
                    style={[
                      styles.subcategoryItem,
                      selectedCategory === child.id && styles.selectedCategory
                    ]}
                    onPress={() => handleCategoryPress(child.id)}
                  >
                    <MaterialIcons
                      name={child.icon as any}
                      size={16}
                      color={selectedCategory === child.id ? theme.colors.primary : theme.colors.textLight}
                      style={[styles.categoryIcon, { marginLeft: 24 }]}
                    />
                    <Text style={[
                      styles.subcategoryText,
                      selectedCategory === child.id && styles.selectedCategoryText
                    ]}>
                      {child.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.sortOption}
                onPress={() => onSortChange(option.value)}
              >
                <Text style={styles.sortOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={onClose}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '85%',
    backgroundColor: theme.colors.background,
    paddingTop: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2,  height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
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
  menuBorder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 4,
    backgroundColor: theme.colors.primary,
    opacity: 0.6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedCategory: {
    backgroundColor: 'rgba(45, 27, 22, 0.1)',
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  selectedCategoryText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  arrowIcon: {
    marginLeft: 'auto',
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: 44,
    borderRadius: 8,
    marginBottom: 2,
    backgroundColor: theme.colors.background,
  },
  subcategoryText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textLight,
  },
  sortOption: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  sortOptionText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '400',
  },
  selectedSortOption: {
    backgroundColor: 'rgba(45, 27, 22, 0.05)',
  },
  selectedSortText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  chevronIcon: {
    marginLeft: 'auto',
  },
  footer: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 'auto',
    paddingTop: 24,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SideMenu;
