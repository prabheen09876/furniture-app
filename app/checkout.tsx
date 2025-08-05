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
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [step, setStep] = useState(1); // 1: Shipping, 2: Review (skip payment for pay-on-delivery)

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
      // Generate unique order number
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      // Create order in the database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          subtotal: getTotalPrice(),
          total_amount: getTotalPrice(),
          shipping_address: `${fullName}\n${phone}\n${address}${landmark ? ', ' + landmark : ''}\n${city}, ${state} ${zip}${alternatePhone ? '\nAlt: ' + alternatePhone : ''}${deliveryInstructions ? '\nInstructions: ' + deliveryInstructions : ''}`,
          status: 'pending'
        })
        .select();

      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = items.map(item => ({
        order_id: orderData[0].id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.products.price,
        total_price: item.products.price * item.quantity,
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
        "Order Placed Successfully!",
        `Your order has been placed successfully. Order will be delivered with pay-on-delivery option.\n\nOrder Number: ${orderNumber}`,
        [{ text: "View Orders", onPress: () => router.replace('/orders') }]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const requiredFields = [
      { field: fullName, name: 'Full Name' },
      { field: phone, name: 'Phone Number' },
      { field: address, name: 'Street Address' },
      { field: city, name: 'City' },
      { field: state, name: 'State' },
      { field: zip, name: 'Zip Code' }
    ];

    // Check for empty required fields
    const emptyField = requiredFields.find(item => !item.field.trim());
    if (emptyField) {
      Alert.alert("Incomplete Information", `Please enter your ${emptyField.name.toLowerCase()}`);
      return false;
    }

    // Validate phone number format (minimum 10 digits)
    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      Alert.alert("Invalid Phone Number", "Please enter a valid 10-digit phone number");
      return false;
    }

    // Validate zip code (exactly 6 digits)
    const zipRegex = /^\d{6}$/;
    if (!zipRegex.test(zip)) {
      Alert.alert("Invalid Zip Code", "Please enter a valid 6-digit zip code");
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (validateForm()) {
      setStep(2); // Only proceed to next step if validation passes
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const renderStepIndicator = () => (
    <BlurView intensity={25} tint="light" style={styles.stepIndicator}>
      <View style={styles.stepContainer}>
        <View style={[styles.stepDot, step >= 1 && styles.activeStepDot]}>
          <Text style={[styles.stepNumber, step >= 1 && styles.activeStepNumber]}>1</Text>
        </View>
        <Text style={[styles.stepLabel, step >= 1 && styles.activeStepLabel]}>Shipping</Text>
      </View>
      <View style={styles.stepLine} />
      <View style={styles.stepContainer}>
        <View style={[styles.stepDot, step >= 2 && styles.activeStepDot]}>
          <Text style={[styles.stepNumber, step >= 2 && styles.activeStepNumber]}>2</Text>
        </View>
        <Text style={[styles.stepLabel, step >= 2 && styles.activeStepLabel]}>Review</Text>
      </View>
    </BlurView>
  );

  const renderShippingForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <MapPin size={20} color="#2D1B16" strokeWidth={2} />
        <Text style={styles.formTitle}>Shipping Information</Text>
      </View>
      
      {/* Contact Information */}
      <BlurView intensity={40} style={[styles.inputContainer, !fullName && step === 1 && styles.requiredField]}>
        <Text style={styles.inputLabel}>
          Full Name <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          placeholderTextColor="#8B7355"
        />
      </BlurView>
      
      <BlurView intensity={40} style={[styles.inputContainer, !phone && step === 1 && styles.requiredField]}>
        <Text style={styles.inputLabel}>
          Phone Number <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone number"
          placeholderTextColor="#8B7355"
          keyboardType="phone-pad"
          maxLength={15}
        />
      </BlurView>
      
      {/* Address Information */}
      <BlurView intensity={40} style={[styles.inputContainer, !address && step === 1 && styles.requiredField]}>
        <Text style={styles.inputLabel}>
          Street Address <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="House/Flat No., Street Name"
          placeholderTextColor="#8B7355"
          multiline
          numberOfLines={2}
        />
      </BlurView>
      
      <BlurView intensity={40} style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Landmark (Optional)</Text>
        <TextInput
          style={styles.input}
          value={landmark}
          onChangeText={setLandmark}
          placeholder="Near by landmark"
          placeholderTextColor="#8B7355"
        />
      </BlurView>
      
      <View style={styles.rowInputs}>
        <BlurView intensity={40} style={[styles.inputContainer, { flex: 2, marginRight: 10 }, !city && step === 1 && styles.requiredField]}>
          <Text style={styles.inputLabel}>
            City <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor="#8B7355"
          />
        </BlurView>
        
        <BlurView intensity={40} style={[styles.inputContainer, { flex: 1 }, !state && step === 1 && styles.requiredField]}>
          <Text style={styles.inputLabel}>
            State <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={state}
            onChangeText={setState}
            placeholder="State"
            placeholderTextColor="#8B7355"
          />
        </BlurView>
      </View>
      
      <BlurView intensity={40} style={[styles.inputContainer, !zip && step === 1 && styles.requiredField]}>
        <Text style={styles.inputLabel}>
          Zip Code <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
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
      
      {/* Additional Information */}
      <BlurView intensity={40} style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Alternate Phone (Optional)</Text>
        <TextInput
          style={styles.input}
          value={alternatePhone}
          onChangeText={setAlternatePhone}
          placeholder="Alternate contact number"
          placeholderTextColor="#8B7355"
          keyboardType="phone-pad"
          maxLength={15}
        />
      </BlurView>
      
      <BlurView intensity={40} style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Delivery Instructions (Optional)</Text>
        <TextInput
          style={styles.input}
          value={deliveryInstructions}
          onChangeText={setDeliveryInstructions}
          placeholder="Any special delivery instructions"
          placeholderTextColor="#8B7355"
          multiline
          numberOfLines={3}
        />
      </BlurView>
      
      {/* Contact Notice */}
      <BlurView intensity={25} style={styles.contactNotice}>
        <Text style={styles.contactNoticeTitle}>📞 We'll Contact You Soon!</Text>
        <Text style={styles.contactNoticeText}>
          Our team will contact you via email and phone call to confirm your order details and delivery schedule. Please ensure your contact information is correct.
        </Text>
      </BlurView>
      
      <TouchableOpacity style={styles.continueButton} onPress={nextStep}>
        <Text style={styles.continueButtonText}>Continue to Review</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOrderReview = () => (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <Check size={20} color="#2D1B16" strokeWidth={2} />
        <Text style={styles.formTitle}>Review Your Order</Text>
      </View>
      
      {/* Order Items */}
      <BlurView intensity={40} style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Items ({items.length})</Text>
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

      {/* Shipping Details */}
      <BlurView intensity={40} style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Shipping Details</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewItemName}>Name:</Text>
          <Text style={styles.reviewItemPrice}>{fullName}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewItemName}>Phone:</Text>
          <Text style={styles.reviewItemPrice}>{phone}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewItemName}>Address:</Text>
          <Text style={styles.reviewItemPrice} numberOfLines={3}>
            {address}{landmark ? `, ${landmark}` : ''}
          </Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewItemName}>City:</Text>
          <Text style={styles.reviewItemPrice}>{city}, {state} {zip}</Text>
        </View>
        {alternatePhone && (
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemName}>Alt Phone:</Text>
            <Text style={styles.reviewItemPrice}>{alternatePhone}</Text>
          </View>
        )}
        {deliveryInstructions && (
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemName}>Instructions:</Text>
            <Text style={styles.reviewItemPrice} numberOfLines={2}>
              {deliveryInstructions}
            </Text>
          </View>
        )}
      </BlurView>

      {/* Payment Method */}
      <BlurView intensity={40} style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Payment Method</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewItemName}>💰 Pay on Delivery</Text>
          <Text style={styles.reviewItemPrice}>Cash/Card</Text>
        </View>
      </BlurView>

      {/* Contact Notice */}
      <BlurView intensity={25} style={styles.contactNotice}>
        <Text style={styles.contactNoticeTitle}>📞 Order Confirmation</Text>
        <Text style={styles.contactNoticeText}>
          After placing your order, our team will contact you within 24 hours via email and phone to confirm order details and schedule delivery.
        </Text>
      </BlurView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.backButton2} 
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
        {step === 2 && renderOrderReview()}
      </ScrollView>
    </LinearGradient>
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 24,
  },
  authButton: {
    backgroundColor: '#2D1B16',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#2D1B16',
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  shopButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  stepIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 115, 85, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activeStepDot: {
    backgroundColor: '#2D1B16',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
  },
  activeStepNumber: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
  },
  activeStepLabel: {
    color: '#2D1B16',
    fontWeight: '600',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#8B7355',
    opacity: 0.3,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D1B16',
    marginLeft: 10,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputLabel: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    color: '#2D1B16',
    fontWeight: '500',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  continueButton: {
    backgroundColor: '#2D1B16',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  backButton2: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    fontSize: 16,
    color: '#2D1B16',
    fontWeight: '600',
  },
  continueButton2: {
    backgroundColor: '#2D1B16',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  reviewSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewItemName: {
    fontSize: 14,
    color: '#2D1B16',
    flex: 1,
    marginRight: 12,
  },
  reviewItemPrice: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '600',
  },
  reviewTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 115, 85, 0.2)',
  },
  reviewTotalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D1B16',
  },
  reviewTotalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D1B16',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactNotice: {
    backgroundColor: 'rgba(45, 27, 22, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(45, 27, 22, 0.2)',
  },
  contactNoticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactNoticeText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
  },
  requiredField: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 16,
  },
  requiredAsterisk: {
    color: '#FF6B6B',
    fontSize: 16,
    lineHeight: 16,
  },
});