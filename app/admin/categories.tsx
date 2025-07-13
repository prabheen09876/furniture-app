import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Plus, Search, CreditCard as Edit3, Trash2, Grid3x3, Eye, EyeOff } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type Category = Database['public']['Tables']['categories']['Row'] & {
  product_count?: number;
};

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Fetch product counts for each category
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count } = await supabase
            .from('products')
            .select('id', { count: 'exact' })
            .eq('category', category.slug)
            .eq('is_active', true);

          return {
            ...category,
            product_count: count || 0,
          };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryId);

              if (error) throw error;
              
              setCategories(categories.filter(c => c.id !== categoryId));
              Alert.alert('Success', 'Category deleted successfully');
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          }
        }
      ]
    );
  };

  const toggleCategoryStatus = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;
      
      setCategories(categories.map(c => 
        c.id === category.id ? { ...c, is_active: !c.is_active } : c
      ));
    } catch (error) {
      console.error('Error updating category status:', error);
      Alert.alert('Error', 'Failed to update category status');
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#2D1B16" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <BlurView intensity={40} style={styles.searchBar}>
          <Search size={20} color="#8B7355" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor="#8B7355"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </BlurView>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <BlurView intensity={40} style={styles.statCard}>
          <Grid3x3 size={20} color="#4F46E5" strokeWidth={2} />
          <Text style={styles.statValue}>{categories.length}</Text>
          <Text style={styles.statLabel}>Total Categories</Text>
        </BlurView>
        
        <BlurView intensity={40} style={styles.statCard}>
          <Eye size={20} color="#059669" strokeWidth={2} />
          <Text style={styles.statValue}>{categories.filter(c => c.is_active).length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </BlurView>
        
        <BlurView intensity={40} style={styles.statCard}>
          <EyeOff size={20} color="#DC2626" strokeWidth={2} />
          <Text style={styles.statValue}>{categories.filter(c => !c.is_active).length}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </BlurView>
      </View>

      {/* Categories List */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.categoriesContainer}>
          {filteredCategories.map((category) => (
            <BlurView key={category.id} intensity={40} style={styles.categoryCard}>
              {category.image_url && (
                <Image source={{ uri: category.image_url }} style={styles.categoryImage} />
              )}
              
              <View style={styles.categoryInfo}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {category.name}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    category.is_active ? styles.activeBadge : styles.inactiveBadge
                  ]}>
                    <Text style={[
                      styles.statusText,
                      category.is_active ? styles.activeText : styles.inactiveText
                    ]}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                
                {category.description && (
                  <Text style={styles.categoryDescription} numberOfLines={2}>
                    {category.description}
                  </Text>
                )}
                
                <View style={styles.categoryMeta}>
                  <Text style={styles.categorySlug}>/{category.slug}</Text>
                  <Text style={styles.productCount}>
                    {category.product_count} products
                  </Text>
                </View>
              </View>

              <View style={styles.categoryActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => toggleCategoryStatus(category)}
                >
                  {category.is_active ? (
                    <EyeOff size={16} color="#8B7355" strokeWidth={2} />
                  ) : (
                    <Eye size={16} color="#059669" strokeWidth={2} />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setEditingCategory(category)}
                >
                  <Edit3 size={16} color="#4F46E5" strokeWidth={2} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => deleteCategory(category.id)}
                >
                  <Trash2 size={16} color="#DC2626" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </BlurView>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add/Edit Category Modal */}
      <CategoryModal
        visible={showAddModal || !!editingCategory}
        category={editingCategory}
        onClose={() => {
          setShowAddModal(false);
          setEditingCategory(null);
        }}
        onSave={() => {
          fetchCategories();
          setShowAddModal(false);
          setEditingCategory(null);
        }}
      />
    </LinearGradient>
  );
}

// Category Modal Component
function CategoryModal({ 
  visible, 
  category, 
  onClose, 
  onSave 
}: {
  visible: boolean;
  category: Category | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    image_url: '',
    sort_order: '',
    is_active: true,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        slug: category.slug || '',
        image_url: category.image_url || '',
        sort_order: category.sort_order?.toString() || '',
        is_active: category.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        slug: '',
        image_url: '',
        sort_order: '',
        is_active: true,
      });
    }
  }, [category]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: formData.slug || generateSlug(name),
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }

    if (!formData.slug.trim()) {
      Alert.alert('Error', 'Category slug is required');
      return;
    }

    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        slug: formData.slug.trim(),
        image_url: formData.image_url.trim() || null,
        sort_order: parseInt(formData.sort_order) || 0,
        is_active: formData.is_active,
      };

      if (category) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', category.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData);
        
        if (error) throw error;
      }

      Alert.alert('Success', `Category ${category ? 'updated' : 'created'} successfully`);
      onSave();
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', `Failed to ${category ? 'update' : 'create'} category`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {category ? 'Edit Category' : 'Add Category'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={handleNameChange}
              placeholder="Enter category name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Slug</Text>
            <TextInput
              style={styles.input}
              value={formData.slug}
              onChangeText={(text) => setFormData({ ...formData, slug: text })}
              placeholder="category-slug"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter category description"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Image URL</Text>
            <TextInput
              style={styles.input}
              value={formData.image_url}
              onChangeText={(text) => setFormData({ ...formData, image_url: text })}
              placeholder="https://example.com/image.jpg"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Sort Order</Text>
            <TextInput
              style={styles.input}
              value={formData.sort_order}
              onChangeText={(text) => setFormData({ ...formData, sort_order: text })}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setFormData({ ...formData, is_active: !formData.is_active })}
            >
              <Text style={styles.toggleLabel}>Active Category</Text>
              <View style={[
                styles.toggle,
                formData.is_active ? styles.toggleActive : styles.toggleInactive
              ]}>
                <View style={[
                  styles.toggleThumb,
                  formData.is_active ? styles.thumbActive : styles.thumbInactive
                ]} />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D1B16',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D1B16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B7355',
  },
  scrollView: {
    flex: 1,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  categoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeText: {
    color: '#059669',
  },
  inactiveText: {
    color: '#9CA3AF',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 8,
  },
  categoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categorySlug: {
    fontSize: 12,
    color: '#8B7355',
    fontFamily: 'monospace',
  },
  productCount: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
  },
  categoryActions: {
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8B7355',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
  },
  saveButton: {
    fontSize: 16,
    color: '#2D1B16',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D1B16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#2D1B16',
    fontWeight: '500',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#059669',
  },
  toggleInactive: {
    backgroundColor: '#D1D5DB',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  thumbActive: {
    alignSelf: 'flex-end',
  },
  thumbInactive: {
    alignSelf: 'flex-start',
  },
});