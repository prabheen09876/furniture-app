import { View, Text, TouchableOpacity, Image, ImageSourcePropType, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlaceholderImage from './components/PlaceholderImage';
import theme from '../theme';
import { formatPrice } from '@/utils/format';

type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  image: ImageSourcePropType | null;
  onPress?: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
};

const ProductCard = ({
  id,
  name,
  price,
  image,
  onPress = () => {},
  onFavoritePress = () => {},
  isFavorite = false,
}: ProductCardProps) => {
  const handleFavoritePress = (e: { stopPropagation: () => void; }) => {
    e.stopPropagation();
    onFavoritePress();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ₹${price.toFixed(2)}`}
    >
      <View style={styles.imageContainer}>
        {image ? (
          <Image
            source={image}
            style={styles.image}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <PlaceholderImage
              width={128}
              height={128}
              borderRadius={theme.radius.md}
              backgroundColor={theme.colors.border}
            />
          </View>
        )}
        <Pressable
          onPress={handleFavoritePress}
          style={styles.favoriteButton}
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          accessibilityRole="button"
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? theme.colors.error : theme.colors.textLight}
          />
        </Pressable>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {name}
        </Text>
        <Text style={styles.price}>{formatPrice(price)}</Text>
      </View>
    </TouchableOpacity>
  );
};

type ProductGridProps = {
  products: Array<{
    id: string;
    name: string;
    price: number;
    image: ImageSourcePropType | null;
  }>;
  onProductPress: (id: string) => void;
  onFavoritePress: (id: string, isFavorite: boolean) => void;
  favorites: string[];
};

export const ProductGrid = ({
  products,
  onProductPress,
  onFavoritePress,
  favorites,
}: ProductGridProps) => {
  return (
    <View style={styles.gridContainer}>
      {products.map((product) => (
        <View key={product.id} style={styles.gridItem}>
          <ProductCard
            {...product}
            isFavorite={favorites.includes(product.id)}
            onPress={() => onProductPress(product.id)}
            onFavoritePress={() =>
              onFavoritePress(product.id, favorites.includes(product.id))
            }
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 0,
    marginHorizontal: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    ...theme.shadow.md,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  image: {
    width: '100%',
    height: 128,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
  },
  placeholderContainer: {
    width: '100%',
    height: 128,
    marginBottom: theme.spacing.sm,
  },
  favoriteButton: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    padding: theme.spacing.xs,
    
  },
  detailsContainer: {
    marginTop: theme.spacing.xs,
  },
  name: {
    ...theme.text.body,
    color: theme.colors.text,
    fontWeight: '500',
    marginBottom: theme.spacing.xxs,
    // Ensure text doesn't overflow
    overflow: 'hidden',
  },
  price: {
    ...theme.text.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  column: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    // Ensure columns don't grow beyond their content
    alignSelf: 'flex-start',
  },
  gridItem: {
    width: '48%',  // Set to slightly less than 50% to account for spacing
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    // Add subtle shadow for depth
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: theme.colors.white,
  },
});

export default ProductCard;