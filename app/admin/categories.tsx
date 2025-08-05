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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Plus, Search, Edit3, Trash2, Eye, EyeOff, Upload, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import * as ImagePicker from 'expo-image-picker';
import { ImageUploadService, ImageUploadOptions } from '@/utils/imageUpload';

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
              console.log('Attempting to delete category with ID:', categoryId);
              
              // First check if category exists
              const { data: existingCategory, error: checkError } = await supabase
                .from('categories')
                .select('id, name')
                .eq('id', categoryId)
                .single();
              
              if (checkError) {
                console.error('Error checking category:', checkError);
                throw new Error('Category not found or access denied');
              }
              
              console.log('Found category to delete:', existingCategory);
              
              // Check if category has products
              const { count: productCount, error: countError } = await supabase
                .from('products')
                .select('id', { count: 'exact' })
                .eq('category', existingCategory.name.toLowerCase());
              
              if (countError) {
                console.error('Error counting products:', countError);
              }
              
              if (productCount && productCount > 0) {
                Alert.alert(
                  'Cannot Delete Category',
                  `This category has ${productCount} products. Please move or delete the products first.`
                );
                return;
              }
              
              // Proceed with deletion
              const { error: deleteError } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryId);

              if (deleteError) {
                console.error('Delete error details:', deleteError);
                throw deleteError;
              }
              
              console.log('Category deleted successfully');
              setCategories(categories.filter(c => c.id !== categoryId));
              Alert.alert('Success', 'Category deleted successfully');
            } catch (error: any) {
              console.error('Error deleting category:', error);
              const errorMessage = error?.message || 'Failed to delete category. Please check your permissions.';
              Alert.alert('Error', errorMessage);
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

  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.is_active).length;

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
          <Plus size={20} color="#2D1B16" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <BlurView intensity={30} style={styles.searchBar}>
          <Search size={18} color="#8B7355" strokeWidth={2} />
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
        <BlurView intensity={30} style={styles.statCard}>
          <Text style={styles.statValue}>{totalCategories}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </BlurView>
        <BlurView intensity={30} style={styles.statCard}>
          <Text style={styles.statValue}>{activeCategories}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </BlurView>
        <BlurView intensity={30} style={styles.statCard}>
          <Text style={styles.statValue}>{totalCategories - activeCategories}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </BlurView>
      </View>

      {/* Categories List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.categoriesContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2D1B16" />
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          ) : filteredCategories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No categories found</Text>
            </View>
          ) : (
            filteredCategories.map((category) => (
              <BlurView key={category.id} intensity={30} style={styles.categoryCard}>
                <View style={styles.categoryContent}>
                  {category.image_url ? (
                    <Image source={{ uri: category.image_url }} style={styles.categoryImage} />
                  ) : (
                    <View style={styles.categoryImagePlaceholder}>
                      <Text style={styles.categoryImagePlaceholderText}>
                        {category.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryName}>{category.name}</Text>
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
                      <Text style={styles.categoryDescription}>{category.description}</Text>
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
                        <Eye size={16} color="#8B7355" strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => setEditingCategory(category)}
                    >
                      <Edit3 size={16} color="#8B7355" strokeWidth={2} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deleteCategory(category.id)}
                    >
                      <Trash2 size={16} color="#FF6B47" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
              </BlurView>
            ))
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <CategoryModal
        visible={showAddModal || editingCategory !== null}
        category={editingCategory}
        onClose={() => {
          setShowAddModal(false);
          setEditingCategory(null);
        }}
        onSave={() => {
          setShowAddModal(false);
          setEditingCategory(null);
          fetchCategories();
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
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description || '');
      setImageUrl(category.icon_url || '');
      setSortOrder(category.sort_order.toString());
      setIsActive(category.is_active);
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setImageUrl('');
      setSortOrder('0');
      setIsActive(true);
    }
  }, [category]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setName(name);
    if (!category) {
      setSlug(generateSlug(name));
    }
  };

  const handleImageUpload = async () => {
    const uploadOptions: ImageUploadOptions = {
      bucket: 'category-icons',
      folder: 'category-images',
      aspectRatio: [1, 1],
      quality: 0.8,
    };

    try {
      setUploading(true);
      const uploadResult = await ImageUploadService.pickAndUploadImage(uploadOptions);
      if (uploadResult) {
        setImageUrl(uploadResult.publicUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (imageUrl) {
      try {
        // Extract file path from URL
        const urlParts = imageUrl.split('supabase.co/storage/v1/object/public/category-icons/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('category-icons').remove([filePath]);
        }
      } catch (error) {
        console.warn('Error removing image from storage:', error);
      }
    }
    setImageUrl('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }

    if (!slug.trim()) {
      Alert.alert('Error', 'Category slug is required');
      return;
    }

    setSaving(true);
    try {
      const categoryData = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        icon_url: imageUrl || null,
        sort_order: parseInt(sortOrder) || 0,
        is_active: isActive,
      };

      if (category) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', category.id);

        if (error) throw error;
        Alert.alert('Success', 'Category updated successfully');
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);

        if (error) throw error;
        Alert.alert('Success', 'Category created successfully');
      }

      onSave();
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {category ? 'Edit Category' : 'Add Category'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={[styles.saveButton, saving && { opacity: 0.5 }]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Category Image */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category Image</Text>
            <View style={styles.imageUploadContainer}>
              {imageUrl ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton} 
                    onPress={handleRemoveImage}
                  >
                    <X size={16} color="#FFFFFF" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.imageUploadButton} 
                  onPress={handleImageUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#8B7355" />
                  ) : (
                    <>
                      <Upload size={20} color="#8B7355" strokeWidth={2} />
                      <Text style={styles.imageUploadText}>Upload Image</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={handleNameChange}
              placeholder="Enter category name"
              placeholderTextColor="#8B7355"
            />
          </View>

          {/* Category Slug */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category Slug *</Text>
            <TextInput
              style={styles.input}
              value={slug}
              onChangeText={setSlug}
              placeholder="category-slug"
              placeholderTextColor="#8B7355"
              autoCapitalize="none"
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter category description"
              placeholderTextColor="#8B7355"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Sort Order */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Sort Order</Text>
            <TextInput
              style={styles.input}
              value={sortOrder}
              onChangeText={setSortOrder}
              placeholder="0"
              placeholderTextColor="#8B7355"
              keyboardType="numeric"
            />
          </View>

          {/* Active Status */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Status</Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsActive(!isActive)}
            >
              <Text style={styles.toggleLabel}>
                {isActive ? 'Active' : 'Inactive'}
              </Text>
              <View style={[
                styles.toggle,
                isActive ? styles.toggleActive : styles.toggleInactive
              ]}>
                <View style={[
                  styles.toggleThumb,
                  isActive ? styles.thumbActive : styles.thumbInactive
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8B7355',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8B7355',
  },
  categoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  categoryContent: {
    flexDirection: 'row',
    padding: 16,
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  categoryImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 115, 85, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryImagePlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B7355',
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
  imageUploadContainer: {
    alignItems: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B47',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 2,
    borderColor: 'rgba(139, 115, 85, 0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadText: {
    marginTop: 8,
    fontSize: 12,
    color: '#8B7355',
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
