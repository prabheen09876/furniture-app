import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, CreditCard, MapPin, Truck, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function CheckoutScreen() {
  const { user } = useAuth();
  const { items, getTotalPrice, removeFromCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review

  if (!user) {
    return (
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
        <View style={styles.authPrompt}>
          <Text style={styles.authTitle}>Sign in Required</Text>
          <Text style={styles.authSubtitle}>Please sign in to checkout</Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.authButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (items.length === 0) {
    return (
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#2D1B16" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.title}>Checkout</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some items to your cart first</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/categories')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Create order in the database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: getTotalPrice(),
          shipping_address: `${address}, ${city}, ${state} ${zip}`,
          status: 'pending',
          payment_status: 'paid', // In a real app, this would be handled by a payment processor
        })
        .select();

      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = items.map(item => ({
        order_id: orderData[0].id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.products.price,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;
      
      // Clear cart
      for (const item of items) {
        await removeFromCart(item.id);
      }
      
      Alert.alert(
        "Order Placed Successfully",
        "Thank you for your order! You will receive a confirmation email shortly.",
        [{ text: "OK", onPress: () => router.replace('/') }]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert("Error", "There was a problem placing your order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (step === 1) {
      if (!address || !city || !state || !zip) {
        Alert.alert("Error", "Please fill in all shipping information");
        return false;
      }
      return true;
    } else if (step === 2) {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        Alert.alert("Error", "Please fill in all payment information");
        return false;
      }
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        Alert.alert("Error", "Please enter a valid card number");
        return false;
      }
      return true;
    }
    return true;
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    return formatted.substring(0, 19); // 16 digits + 3 spaces
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const nextStep = () => {
    if (validateForm()) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.stepDot, step >= 1 && styles.activeStepDot]} />
      <View style={styles.stepLine} />
      <View style={[styles.stepDot, step >= 2 && styles.activeStepDot]} />
      <View style={styles.stepLine} />
      <View style={[styles.stepDot, step >= 3 && styles.activeStepDot]} />
    </View>
  );

  const renderShippingForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <MapPin size={20} color="#2D1B16" strokeWidth={2} />
        <Text style={styles.formTitle}>Shipping Information</Text>
      </View>
      
      <BlurView intensity={40} style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Address</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Street Address"
          placeholderTextColor="#8B7355"
        />
      </BlurView>
      
      <View style={styles.rowInputs}>
        <BlurView intensity={40} style={[styles.inputContainer, { flex: 2, marginRight: 10 }]}>
          <Text style={styles.inputLabel}>City</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor="#8B7355"
          />
        </BlurView>
        
        <BlurView intensity={40} style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.inputLabel}>State</Text>
          <TextInput
            style={styles.input}
            value={state}
            onChangeText={setState}
            placeholder="State"
            placeholderTextColor="#8B7355"
          />
        </BlurView>
      </View>
      
      <BlurView intensity={40} style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Zip Code</Text>
        <TextInput
          style={styles.input}
          value={zip}
          onChangeText={setZip}
          placeholder="Zip Code"
          placeholderTextColor="#8B7355"
          keyboardType="numeric"
          maxLength={6}
        />
      </BlurView>
      
      <TouchableOpacity style={styles.continueButton} onPress={nextStep}>
        <Text style={styles.continueButtonText}>Continue to Payment</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPaymentForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <CreditCard size={20} color="#2D1B16" strokeWidth={2} />
        <Text style={styles.formTitle}>Payment Information</Text>
      </View>
      
      <BlurView intensity={40} style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Card Number</Text>
        <TextInput
          style={styles.input}
          value={cardNumber}
          onChangeText={(text) => setCardNumber(formatCardNumber(text))}
          placeholder="1234 5678 9012 3456"
          placeholderTextColor="#8B7355"
          keyboardType="numeric"
          maxLength={19} // 16 digits + 3 spaces
        />
      </BlurView>
      
      <BlurView intensity={40} style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Cardholder Name</Text>
        <TextInput
          style={styles.input}
          value={cardName}
          onChangeText={setCardName}
          placeholder="John Doe"
          placeholderTextColor="#8B7355"
        />
      </BlurView>
      
      <View style={styles.rowInputs}>
        <BlurView intensity={40} style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.inputLabel}>Expiry Date</Text>
          <TextInput
            style={styles.input}
            value={cardExpiry}
            onChangeText={(text) => setCardExpiry(formatExpiry(text))}
            placeholder="MM/YY"
            placeholderTextColor="#8B7355"
            keyboardType="numeric"
            maxLength={5} // MM/YY
          />
        </BlurView>
        
        <BlurView intensity={40} style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.inputLabel}>CVV</Text>
          <TextInput
            style={styles.input}
            value={cardCvv}
            onChangeText={setCardCvv}
            placeholder="123"
            placeholderTextColor="#8B7355"
            keyboardType="numeric"
            maxLength={3}
            secureTextEntry
          />
        </BlurView>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton2} onPress={prevStep}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.continueButton2} onPress={nextStep}>
          <Text style={styles.continueButtonText}>Review Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOrderReview = () => (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <Check size={20} color="#2D1B16" strokeWidth={2} />
        <Text style={styles.formTitle}>Review Your Order</Text>
      </View>
      
      <BlurView intensity={40} style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Items</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.reviewItem}>
            <Text style={styles.reviewItemName} numberOfLines={1}>
              {item.products.name} x{item.quantity}
            </Text>
            <Text style={styles.reviewItemPrice}>
              ₹{(item.products.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        
        <View style={styles.reviewTotal}>
          <Text style={styles.reviewTotalText}>Total:</Text>
          <Text style={styles.reviewTotalPrice}>
            ₹{items.reduce((total, item) => total + (item.products.price * item.quantity), 0).toFixed(2)}
          </Text>
        </View>
      </BlurView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={prevStep}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.continueButton2, loading && styles.disabledButton]} 
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? "Processing..." : "Place Order"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#2D1B16" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.scrollView}>
        {renderStepIndicator()}
        {step === 1 && renderShippingForm()}
        {step === 2 && renderPaymentForm()}
        {step === 3 && renderOrderReview()}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1B16',
  },
  placeholder: {
    width: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1B16',
  },
  emptySubtitle: {
    fontSize: 18,
    color: '#8B7355',
  },
  shopButton: {
    backgroundColor: '#F5E6D3',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  shopButtonText: {
    fontSize: 18,
    color: '#2D1B16',
  },
  formContainer: {
    padding: 20,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginLeft: 10,
  },
  inputContainer: {
    backgroundColor: '#F5E6D3',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 18,
    color: '#8B7355',
    marginBottom: 5,
  },
  input: {
    fontSize: 18,
    color: '#2D1B16',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#F5E6D3',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  continueButtonText: {
    fontSize: 18,
    color: '#2D1B16',
  },
  backButton2: {
    backgroundColor: '#F5E6D3',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 18,
    color: '#2D1B16',
  },
  continueButton2: {
    backgroundColor: '#F5E6D3',
    padding: 10,
    borderRadius: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B7355',
  },
  activeStepDot: {
    backgroundColor: '#2D1B16',
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: '#8B7355',
  },
  reviewSection: {
    backgroundColor: '#F5E6D3',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 5,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewItemName: {
    fontSize: 18,
    color: '#2D1B16',
  },
  reviewItemPrice: {
    fontSize: 18,
    color: '#8B7355',
  },
  reviewTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D1B16',
  },
  reviewTotalPrice: {
    fontSize: 18,
    color: '#8B7355',
  },
  reviewText: {
    fontSize: 18,
    color: '#8B7355',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
});