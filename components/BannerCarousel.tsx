import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');
const BANNER_WIDTH = screenWidth - 40; // 20px margin on each side
const BANNER_HEIGHT = 180;

interface Banner {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
}

interface BannerCarouselProps {
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export default function BannerCarousel({ 
  autoPlay = true, 
  autoPlayInterval = 4000 
}: BannerCarouselProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchBanners();
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoPlay && banners.length > 1) {
      startAutoPlay();
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [banners, autoPlay]);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
    
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, autoPlayInterval);
  };

  const scrollToIndex = (index: number) => {
    if (scrollViewRef.current) {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Scroll to new position
        scrollViewRef.current?.scrollTo({
          x: index * (BANNER_WIDTH + 20),
          animated: true,
        });
        
        // Fade back in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (BANNER_WIDTH + 20));
    
    if (index !== currentIndex && index >= 0 && index < banners.length) {
      setCurrentIndex(index);
      
      // Reset auto-play timer when user manually scrolls
      if (autoPlay && banners.length > 1) {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
        setTimeout(() => {
          startAutoPlay();
        }, 2000); // Wait 2 seconds before resuming auto-play
      }
    }
  };

  const handleBannerPress = (banner: Banner) => {
    if (banner.link_url) {
      // Navigate to the specified route
      if (banner.link_url.startsWith('/')) {
        router.push(banner.link_url as any);
      } else {
        // Handle external URLs if needed
        console.log('External URL:', banner.link_url);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <BlurView intensity={40} style={styles.loadingBanner}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingText}>Loading banners...</Text>
          </View>
        </BlurView>
      </View>
    );
  }

  if (banners.length === 0) {
    return null; // Don't show anything if no banners
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.carouselContainer, { opacity: fadeAnim }]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          snapToInterval={BANNER_WIDTH + 20}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.scrollContent}
        >
          {banners.map((banner, index) => (
            <TouchableOpacity
              key={banner.id}
              style={[
                styles.bannerContainer,
                index === 0 && styles.firstBanner,
                index === banners.length - 1 && styles.lastBanner,
              ]}
              onPress={() => handleBannerPress(banner)}
              activeOpacity={0.9}
            >
              <BlurView intensity={20} style={styles.banner}>
                <Image
                  source={{ uri: banner.image_url }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
                <View style={styles.bannerOverlay}>
                  <BlurView intensity={60} style={styles.bannerContent}>
                    <Text style={styles.bannerTitle} numberOfLines={2}>
                      {banner.title}
                    </Text>
                    {banner.description && (
                      <Text style={styles.bannerDescription} numberOfLines={2}>
                        {banner.description}
                      </Text>
                    )}
                  </BlurView>
                </View>
              </BlurView>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
              onPress={() => {
                setCurrentIndex(index);
                scrollToIndex(index);
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  loadingContainer: {
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  loadingBanner: {
    height: BANNER_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
  },
  carouselContainer: {
    height: BANNER_HEIGHT,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    marginHorizontal: 10,
  },
  firstBanner: {
    marginLeft: 20,
  },
  lastBanner: {
    marginRight: 20,
  },
  banner: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
  },
  bannerContent: {
    padding: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bannerDescription: {
    fontSize: 14,
    color: '#F5F0E8',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(139, 115, 85, 0.3)',
    transition: 'all 0.3s ease',
  },
  paginationDotActive: {
    backgroundColor: '#8B7355',
    width: 24,
    borderRadius: 4,
  },
});
