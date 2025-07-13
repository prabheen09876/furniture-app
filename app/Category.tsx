import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theme from './theme';

type CategoryProps = {
  icon: string;
  label: string;
  isActive?: boolean;
  onPress?: () => void;
};

const Category = ({
  icon,
  label,
  isActive = false,
  onPress = () => {},
}: CategoryProps) => {
  // Map icon names to MaterialCommunityIcons
  const getIconName = (iconName: string) => {
    const iconMap: Record<string, string> = {
      'grid': 'grid',
      'chair': 'chair-rolling',
      'table-furniture': 'table-furniture',
      'sofa': 'sofa',
      'lamp': 'lamp',
      'dots-horizontal': 'dots-horizontal',
    };
    return iconMap[iconName] || 'help-circle';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.categoryContainer}
      activeOpacity={0.7}
      accessibilityState={{ selected: isActive }}
    >
      <View 
        style={[
          styles.iconContainer,
          isActive ? styles.activeIconContainer : {},
        ]}
      >
        <MaterialCommunityIcons 
          name={getIconName(icon) as any}
          size={24}
          color={isActive ? theme.colors.primary : theme.colors.text}
        />
      </View>
      <Text 
        style={[
          styles.label,
          isActive && styles.activeLabel,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

type CategoryListProps = {
  categories: Array<{ id: string; icon: string; label: string }>;
  activeCategory: string;
  onCategoryChange: (id: string) => void;
};

const CategoryList = ({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryListProps) => {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <Category
            key={category.id}
            icon={category.icon}
            label={category.label}
            isActive={activeCategory === category.id}
            onPress={() => onCategoryChange(category.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  categoryContainer: {
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    width: 70,
  },
  iconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  activeIconContainer: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.secondaryLight,
  },
  label: {
    ...theme.text.caption,
    textAlign: 'center',
    color: theme.colors.textLight,
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  activeLabel: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

// Export CategoryList as default and Category as named export
export default CategoryList;
export { Category };