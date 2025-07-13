import { Dimensions } from 'react-native';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  category: string;
  images: string[];
  colors?: Array<{ name: string; value: string }>;
  inStock: boolean;
  sku: string;
  brand?: string;
};

// Temporary placeholder images (transparent background furniture PNGs recommended)
const placeholder = 'https://images.unsplash.com/photo-1555041463-a27bce3118fc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Minimalist Chair',
    description:
      'A sleek minimalist chair with ergonomic support and premium fabric upholstery. Perfect for modern interiors.',
    price: 249.99,
    originalPrice: 299.99,
    rating: 4.6,
    reviewCount: 98,
    category: 'Chairs',
    images: [placeholder],
    colors: [
      { name: 'Beige', value: '#f5e6d3' },
      { name: 'Charcoal', value: '#4a4a4a' },
    ],
    inStock: true,
    sku: 'CHAIR-0001',
    brand: 'ModernCo',
  },
  {
    id: '2',
    name: 'Modern Table Lamp',
    description: 'A contemporary lamp that provides ambient lighting to any room.',
    price: 89.99,
    rating: 4.4,
    reviewCount: 45,
    category: 'Lamps',
    images: [placeholder],
    inStock: true,
    sku: 'LAMP-0002',
    brand: 'Lightify',
  },
  {
    id: '3',
    name: 'Wooden Coffee Table',
    description: 'Handcrafted coffee table made from solid oak wood with a natural finish.',
    price: 349.99,
    rating: 4.8,
    reviewCount: 64,
    category: 'Tables',
    images: [placeholder],
    inStock: false,
    sku: 'TABLE-0003',
    brand: 'Oak & Co.',
  },
  // Add more products as needed
];

export const getProductById = (id: string) => PRODUCTS.find((p) => p.id === id);
