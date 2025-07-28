// Shared categories configuration for the furniture app
// This ensures consistency between home page, categories page, and admin panel

export interface CategoryConfig {
  id: string;
  name: string;
  icon: string;
  dbValue: string;
}

export const CATEGORIES: CategoryConfig[] = [
  { id: 'all', name: 'All', icon: '📦', dbValue: 'all' },
  { id: 'chairs', name: 'Chairs', icon: '🪑', dbValue: 'Chairs' },
  { id: 'tables', name: 'Tables', icon: '🪵', dbValue: 'Tables' },
  { id: 'sofas', name: 'Sofas', icon: '🛋️', dbValue: 'Sofas' },
  { id: 'beds', name: 'Beds', icon: '🛏️', dbValue: 'Beds' },
  { id: 'lamps', name: 'Lamps', icon: '💡', dbValue: 'Lamps' },
  { id: 'decor', name: 'Decor', icon: '🖼️', dbValue: 'Decor' },
  { id: 'storage', name: 'Storage', icon: '🗄️', dbValue: 'Storage' },
  { id: 'dressers', name: 'Dressers', icon: '🗄️', dbValue: 'Dressers' },
  { id: 'desks', name: 'Desks', icon: '💻', dbValue: 'Desks' },
  { id: 'cabinets', name: 'Cabinets', icon: '🗄️', dbValue: 'Cabinets' },
  { id: 'outdoor', name: 'Outdoor', icon: '🌳', dbValue: 'Outdoor Furniture' },
];

// Helper function to get database value for a category ID
export const getCategoryDbValue = (categoryId: string): string => {
  const category = CATEGORIES.find(cat => cat.id === categoryId);
  return category?.dbValue || categoryId;
};

// Helper function to get category by ID
export const getCategoryById = (categoryId: string): CategoryConfig | undefined => {
  return CATEGORIES.find(cat => cat.id === categoryId);
};

// Helper function to get category by database value
export const getCategoryByDbValue = (dbValue: string): CategoryConfig | undefined => {
  return CATEGORIES.find(cat => cat.dbValue === dbValue);
};

// Get all categories for display (excluding 'all' if needed)
export const getDisplayCategories = (includeAll: boolean = true): CategoryConfig[] => {
  return includeAll ? CATEGORIES : CATEGORIES.filter(cat => cat.id !== 'all');
};

// Get categories for the home page grid (first 8 categories)
export const getHomePageCategories = (): CategoryConfig[] => {
  return CATEGORIES.slice(0, 8);
};
