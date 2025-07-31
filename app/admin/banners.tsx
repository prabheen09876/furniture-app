import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Trash2, 
  Upload,
  Eye,
  EyeOff,
  Link,
  Image as ImageIcon
} from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

interface Banner {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function BannerManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link_url: '',
    is_active: true,
    display_order: 0,
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      console.error('Error fetching banners:', error);
      Alert.alert('Error', 'Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9], // Banner aspect ratio
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (imageUri: string): Promise<string> => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `banner-${timestamp}-${randomId}.${fileExt}`;
    const filePath = `banner-images/${fileName}`;

    const response = await fetch(imageUri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('banners')
      .upload(filePath, blob);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('banners')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const saveBanner = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a banner title');
      return;
    }

    if (!selectedImage && !editingBanner) {
      Alert.alert('Error', 'Please select an image for the banner');
      return;
    }

    setUploading(true);
    try {
      let imageUrl = editingBanner?.image_url || '';
      
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const bannerData = {
        ...formData,
        image_url: imageUrl,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('banners')
          .insert([bannerData]);

        if (error) throw error;
      }

      Alert.alert('Success', `Banner ${editingBanner ? 'updated' : 'created'} successfully`);
      setModalVisible(false);
      resetForm();
      fetchBanners();
    } catch (error: any) {
      console.error('Error saving banner:', error);
      Alert.alert('Error', 'Failed to save banner');
    } finally {
      setUploading(false);
    }
  };

  const deleteBanner = async (id: string) => {
    Alert.alert(
      'Delete Banner',
      'Are you sure you want to delete this banner?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('banners')
                .delete()
                .eq('id', id);

              if (error) throw error;
              fetchBanners();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete banner');
            }
          },
        },
      ]
    );
  };

  const toggleBannerStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchBanners();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update banner status');
    }
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      link_url: banner.link_url || '',
      is_active: banner.is_active,
      display_order: banner.display_order,
    });
    setSelectedImage(null);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      description: '',
      link_url: '',
      is_active: true,
      display_order: banners.length,
    });
    setSelectedImage(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#2D1B16" strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Banner Management</Text>
            <Text style={styles.subtitle}>Manage carousel banners</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Plus size={20} color="#2D1B16" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Banners List */}
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.bannersContainer}>
            {loading ? (
              <View style={styles.emptyState}>
                <ImageIcon size={48} color="#8B7355" strokeWidth={1.5} />
                <Text style={styles.emptyStateTitle}>Loading Banners...</Text>
              </View>
            ) : banners.length === 0 ? (
              <View style={styles.emptyState}>
                <ImageIcon size={48} color="#8B7355" strokeWidth={1.5} />
                <Text style={styles.emptyStateTitle}>No Banners Found</Text>
                <Text style={styles.emptyStateText}>Create your first banner to get started</Text>
              </View>
            ) : (
              banners.map((banner) => (
                <BlurView key={banner.id} intensity={40} style={styles.bannerCard}>
                  <Image source={{ uri: banner.image_url }} style={styles.bannerImage} />
                  <View style={styles.bannerContent}>
                    <View style={styles.bannerHeader}>
                      <View style={styles.bannerInfo}>
                        <Text style={styles.bannerTitle}>{banner.title}</Text>
                        {banner.description && (
                          <Text style={styles.bannerDescription}>{banner.description}</Text>
                        )}
                        <View style={styles.bannerMeta}>
                          <Text style={styles.orderText}>Order: {banner.display_order}</Text>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: banner.is_active ? '#059669' : '#DC2626' }
                          ]}>
                            <Text style={styles.statusText}>
                              {banner.is_active ? 'Active' : 'Inactive'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.bannerActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => toggleBannerStatus(banner.id, banner.is_active)}
                        >
                          {banner.is_active ? (
                            <EyeOff size={16} color="#8B7355" strokeWidth={2} />
                          ) : (
                            <Eye size={16} color="#8B7355" strokeWidth={2} />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => openEditModal(banner)}
                        >
                          <Edit3 size={16} color="#8B7355" strokeWidth={2} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => deleteBanner(banner.id)}
                        >
                          <Trash2 size={16} color="#DC2626" strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </BlurView>
              ))
            )}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {editingBanner ? 'Edit Banner' : 'Add Banner'}
                </Text>
                <TouchableOpacity onPress={saveBanner} disabled={uploading}>
                  <Text style={[styles.saveButton, uploading && styles.disabledButton]}>
                    {uploading ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm}>
                {/* Image Upload */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Banner Image</Text>
                  <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
                    {selectedImage || editingBanner?.image_url ? (
                      <Image
                        source={{ uri: selectedImage || editingBanner?.image_url }}
                        style={styles.uploadedImage}
                      />
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <Upload size={32} color="#8B7355" strokeWidth={1.5} />
                        <Text style={styles.uploadText}>Tap to select image</Text>
                        <Text style={styles.uploadSubtext}>Recommended: 16:9 aspect ratio</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Banner Details</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Title *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.title}
                      onChangeText={(text) => setFormData({ ...formData, title: text })}
                      placeholder="Enter banner title"
                      placeholderTextColor="#8B7355"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                      placeholder="Enter banner description"
                      placeholderTextColor="#8B7355"
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Link URL</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.link_url}
                      onChangeText={(text) => setFormData({ ...formData, link_url: text })}
                      placeholder="Enter link URL (optional)"
                      placeholderTextColor="#8B7355"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Display Order</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.display_order.toString()}
                      onChangeText={(text) => setFormData({ ...formData, display_order: parseInt(text) || 0 })}
                      placeholder="0"
                      placeholderTextColor="#8B7355"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.switchGroup}>
                    <Text style={styles.inputLabel}>Active Status</Text>
                    <TouchableOpacity
                      style={[styles.switch, formData.is_active && styles.switchActive]}
                      onPress={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    >
                      <View style={[styles.switchThumb, formData.is_active && styles.switchThumbActive]} />
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </LinearGradient>
          </SafeAreaView>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
  },
  subtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  bannersContainer: {
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
  },
  bannerCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  bannerContent: {
    padding: 16,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bannerInfo: {
    flex: 1,
    marginRight: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 4,
  },
  bannerDescription: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 8,
    lineHeight: 18,
  },
  bannerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderText: {
    fontSize: 12,
    color: '#8B7355',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 115, 85, 0.2)',
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
    fontWeight: '600',
    color: '#2D1B16',
  },
  disabledButton: {
    color: '#8B7355',
  },
  modalForm: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 12,
  },
  imageUpload: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D1B16',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1B16',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D1B16',
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.2)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(139, 115, 85, 0.3)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: '#059669',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
});
