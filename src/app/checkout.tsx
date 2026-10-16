import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../constants/theme';
import { useCartStore } from '../stores/cartStore';

import {
  addSavedAddress,
  getPhoneNumbers,
  getSavedAddresses,
  type SavedAddress,
  type SavedPhoneNumber,
} from '../services/auth/authApi';

import { createCustomerOrder } from '../services/customer/orderApi';

type PaymentMethod = 'COD' | 'JAZZCASH' | 'EASYPAISA' | 'CARD';

type AddressForm = {
  label: string;
  recipientName: string;
  phone: string;
  alternatePhone: string;
  address: string;
  city: string;
  area: string;
  landmark: string;
};

const EMPTY_ADDRESS: AddressForm = {
  label: 'Home',
  recipientName: '',
  phone: '',
  alternatePhone: '',
  address: '',
  city: '',
  area: '',
  landmark: '',
};

const PAYMENT_MAP: Record<
  PaymentMethod,
  'cash_on_delivery' | 'jazzcash' | 'easypaisa' | 'card'
> = {
  COD: 'cash_on_delivery',
  JAZZCASH: 'jazzcash',
  EASYPAISA: 'easypaisa',
  CARD: 'card',
};

const formatPrice = (amount: number) =>
  `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;

function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function getErrorMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong. Please try again.'
  );
}

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [savedPhones, setSavedPhones] = useState<SavedPhoneNumber[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState('');
  const [addressForm, setAddressForm] =
    useState<AddressForm>(EMPTY_ADDRESS);

  const [loadingSavedInfo, setLoadingSavedInfo] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savedInfoError, setSavedInfoError] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [items]
  );

  const estimatedDeliveryFee = subtotal >= 1500 ? 0 : 99;
  const estimatedTotal = subtotal + estimatedDeliveryFee;

  const itemCount = items.reduce(
    (count, item) => count + item.quantity,
    0
  );

  const selectedAddress = savedAddresses.find(
    (address) => address._id === selectedAddressId
  );

  useEffect(() => {
    let mounted = true;

    async function loadSavedInfo() {
      setLoadingSavedInfo(true);
      setSavedInfoError('');

      try {
        const [addressesResult, phonesResult] = await Promise.allSettled([
          getSavedAddresses(),
          getPhoneNumbers(),
        ]);

        if (!mounted) return;

        const addresses =
          addressesResult.status === 'fulfilled'
            ? addressesResult.value
            : [];

        const phones =
          phonesResult.status === 'fulfilled'
            ? phonesResult.value
            : [];

        setSavedAddresses(addresses);
        setSavedPhones(phones);

        const defaultAddress =
          addresses.find((address) => address.isDefault) ?? addresses[0];

        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
          setSelectedPhone(defaultAddress.phone || '');
        } else {
          const primaryPhone =
            phones.find((phone) => phone.isPrimary) ?? phones[0];

          if (primaryPhone) setSelectedPhone(primaryPhone.number);
          setIsAddingAddress(true);
        }

        if (
          addressesResult.status === 'rejected' &&
          phonesResult.status === 'rejected'
        ) {
          setSavedInfoError(
            'Could not load saved details. You can still enter a new address.'
          );
          setIsAddingAddress(true);
        } else if (addressesResult.status === 'rejected') {
          setSavedInfoError(
            'Saved addresses could not be loaded. Enter your delivery address below.'
          );
          setIsAddingAddress(true);
        }
      } catch {
        if (!mounted) return;
        setSavedInfoError(
          'Could not load saved details. Enter your delivery information below.'
        );
        setIsAddingAddress(true);
      } finally {
        if (mounted) setLoadingSavedInfo(false);
      }
    }

    void loadSavedInfo();

    return () => {
      mounted = false;
    };
  }, []);

  const updateForm = (field: keyof AddressForm, value: string) => {
    setAddressForm((current) => ({ ...current, [field]: value }));
  };

  const selectSavedAddress = (address: SavedAddress) => {
    setSelectedAddressId(address._id);
    setSelectedPhone(address.phone || '');
    setEditingAddressId('');
    setIsAddingAddress(false);
  };

  const startNewAddress = () => {
    setAddressForm({
      ...EMPTY_ADDRESS,
      recipientName: selectedAddress?.recipientName || '',
      phone: selectedAddress?.phone || selectedPhone || '',
      alternatePhone: selectedAddress?.alternatePhone || '',
      city: selectedAddress?.city || '',
      area: selectedAddress?.area || '',
    });

    setSelectedAddressId('');
    setEditingAddressId('');
    setIsAddingAddress(true);
  };

  const startEditingAddress = (address: SavedAddress) => {
    setAddressForm({
      label: address.label || 'Home',
      recipientName: address.recipientName || '',
      phone: address.phone || '',
      alternatePhone: address.alternatePhone || '',
      address: address.address || '',
      city: address.city || '',
      area: address.area || '',
      landmark: address.landmark || '',
    });

    setSelectedAddressId(address._id);
    setSelectedPhone(address.phone || '');
    setEditingAddressId(address._id);
    setIsAddingAddress(true);
  };

  const validateAddressForm = (): AddressForm | null => {
    const form: AddressForm = {
      label: addressForm.label.trim() || 'Home',
      recipientName: addressForm.recipientName.trim(),
      phone: (selectedPhone || addressForm.phone).trim(),
      alternatePhone: addressForm.alternatePhone.trim(),
      address: addressForm.address.trim(),
      city: addressForm.city.trim(),
      area: addressForm.area.trim(),
      landmark: addressForm.landmark.trim(),
    };

    if (!form.recipientName) {
      showMessage('Name required', 'Enter the recipient name.');
      return null;
    }

    if (!form.phone) {
      showMessage('Phone required', 'Enter a contact number.');
      return null;
    }

    if (!/^[0-9+\s()-]{7,20}$/.test(form.phone)) {
      showMessage(
        'Invalid phone number',
        'Enter a valid phone number, including your country code if needed.'
      );
      return null;
    }

    if (!form.address) {
      showMessage('Address required', 'Enter the complete street address.');
      return null;
    }

    if (!form.city) {
      showMessage('City required', 'Enter your city.');
      return null;
    }

    if (!form.area) {
      showMessage('Area required', 'Enter your area or neighborhood.');
      return null;
    }

    return form;
  };

  const saveAddressAndContinue = async () => {
    if (savingAddress || submitting) return;

    const form = validateAddressForm();
    if (!form) return;

    setSavingAddress(true);

    try {
      const updatedAddresses = await addSavedAddress({
        label: form.label,
        recipientName: form.recipientName,
        phone: form.phone,
        alternatePhone: form.alternatePhone || undefined,
        address: form.address,
        city: form.city,
        area: form.area,
        landmark: form.landmark || undefined,
        isDefault: savedAddresses.length === 0,
      });

      setSavedAddresses(updatedAddresses);

      const matchingAddress = updatedAddresses.find(
        (address) =>
          address.address.trim() === form.address &&
          address.phone.trim() === form.phone &&
          address.recipientName.trim() === form.recipientName
      );

      if (matchingAddress) {
        setSelectedAddressId(matchingAddress._id);
      } else {
        setSelectedAddressId('');
      }

      setSelectedPhone(form.phone);
      setEditingAddressId('');
      setIsAddingAddress(false);

      showMessage(
        'Address saved',
        matchingAddress
          ? 'Your address has been saved and selected for checkout.'
          : 'The address was submitted. You can continue checkout with the details you entered.'
      );
    } catch (error: any) {
      showMessage('Could not save address', getErrorMessage(error));
    } finally {
      setSavingAddress(false);
    }
  };

  const getDeliveryDetails = () => {
    if (isAddingAddress) {
      const form = validateAddressForm();
      if (!form) return null;

      return {
        name: form.recipientName,
        phone: form.phone,
        alternatePhone: form.alternatePhone || undefined,
        address: form.address,
        label: form.area || form.label || 'Home',
        city: form.city,
        area: form.area,
        landmark: form.landmark,
      };
    }

    if (!selectedAddress) {
      showMessage(
        'Delivery address required',
        'Select a saved address or add a new one.'
      );
      return null;
    }

    const phone = (selectedPhone || selectedAddress.phone).trim();

    if (!phone || !/^[0-9+\s()-]{7,20}$/.test(phone)) {
      showMessage(
        'Invalid phone number',
        'Select or enter a valid contact number.'
      );
      return null;
    }

    if (!selectedAddress.recipientName.trim()) {
      showMessage('Name required', 'The saved address has no recipient name.');
      return null;
    }

    if (!selectedAddress.address.trim()) {
      showMessage('Address required', 'The saved address is incomplete.');
      return null;
    }

    if (!selectedAddress.city?.trim() || !selectedAddress.area?.trim()) {
      showMessage(
        'Address incomplete',
        'Edit the saved address and provide the city and area.'
      );
      return null;
    }

    return {
      name: selectedAddress.recipientName.trim(),
      phone,
      alternatePhone: selectedAddress.alternatePhone?.trim() || undefined,
      address: selectedAddress.address.trim(),
      label: selectedAddress.area?.trim() || selectedAddress.label || 'Home',
      city: selectedAddress.city.trim(),
      area: selectedAddress.area.trim(),
      landmark: selectedAddress.landmark?.trim() || '',
    };
  };

  const submitOrder = async () => {
    if (submitting || loadingSavedInfo || savingAddress) return;

    if (items.length === 0) {
      showMessage('Cart is empty', 'Add food before placing an order.');
      return;
    }

    if (paymentMethod !== 'COD') {
      showMessage(
        'Online payments are not ready',
        'JazzCash, Easypaisa and card payments require a connected payment gateway. Choose Cash on Delivery for now.'
      );
      return;
    }

    const delivery = getDeliveryDetails();
    if (!delivery) return;

    const restaurantIds = [...new Set(items.map((item) => item.restaurantId))];

    if (restaurantIds.length !== 1) {
      showMessage(
        'Different restaurants',
        'Your cart contains items from multiple restaurants. Please order from one restaurant at a time.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await createCustomerOrder({
        items: items.map((item) => ({
          food: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
        delivery: {
          name: delivery.name,
          phone: delivery.phone,
          alternatePhone: delivery.alternatePhone,
          address: delivery.address,
          label: delivery.label,
        },
        paymentMethod: PAYMENT_MAP[paymentMethod],
        customerNote: customerNote.trim() || undefined,
      });

      const order = response?.order;

      if (!order?._id) {
        throw new Error(
          'The server did not return an order ID. Check your order history before trying again.'
        );
      }

      try {
        await clearCart();
      } catch {
        // The order exists; continue to its tracking screen.
      }

      router.replace(`/orders/${order._id}` as any);
    } catch (error: any) {
      showMessage('Order not placed', getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceOrder = () => {
    if (submitting || loadingSavedInfo || savingAddress) return;

    if (paymentMethod !== 'COD') {
      showMessage(
        'Online payments are not ready',
        'Please select Cash on Delivery. Online payment processing has not been connected yet.'
      );
      return;
    }

    if (items.length === 0) {
      showMessage('Cart is empty', 'Add food before placing an order.');
      return;
    }

    const delivery = getDeliveryDetails();
    if (!delivery) return;

    const message =
      `Place your order with Cash on Delivery?\n\n` +
      `Estimated total: ${formatPrice(estimatedTotal)}\n\n` +
      'The server will calculate the final amount and delivery fee.';

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        void submitOrder();
      }
      return;
    }

    Alert.alert('Confirm Order', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Place Order',
        onPress: () => void submitOrder(),
      },
    ]);
  };

  const paymentMethods: {
    id: PaymentMethod;
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      id: 'COD',
      title: 'Cash on Delivery',
      subtitle: 'Pay when your order arrives',
      icon: 'cash-outline',
    },
    {
      id: 'JAZZCASH',
      title: 'JazzCash',
      subtitle: 'Payment gateway setup required',
      icon: 'phone-portrait-outline',
    },
    {
      id: 'EASYPAISA',
      title: 'Easypaisa',
      subtitle: 'Payment gateway setup required',
      icon: 'phone-portrait-outline',
    },
    {
      id: 'CARD',
      title: 'Debit / Credit Card',
      subtitle: 'Payment gateway setup required',
      icon: 'card-outline',
    },
  ];

  const renderAddressForm = () => (
    <View style={styles.formCard}>
      <View style={styles.formHeadingRow}>
        <View style={styles.formHeadingIcon}>
          <Ionicons
            name="location-outline"
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.formHeadingContent}>
          <Text style={styles.formTitle}>
            {editingAddressId ? 'Edit delivery address' : 'New delivery address'}
          </Text>
          <Text style={styles.formSubtitle}>
            Enter accurate details for your rider.
          </Text>
        </View>
      </View>

      <Text style={styles.inputLabel}>ADDRESS LABEL</Text>
      <View style={styles.labelChoices}>
        {['Home', 'Work', 'Other'].map((label) => (
          <TouchableOpacity
            key={label}
            style={[
              styles.labelChoice,
              addressForm.label === label && styles.labelChoiceActive,
            ]}
            onPress={() => updateForm('label', label)}
            disabled={savingAddress || submitting}
          >
            <Text
              style={[
                styles.labelChoiceText,
                addressForm.label === label && styles.labelChoiceTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.inputLabel}>RECIPIENT NAME *</Text>
      <TextInput
        value={addressForm.recipientName}
        onChangeText={(value) => updateForm('recipientName', value)}
        placeholder="Name of person receiving the order"
        placeholderTextColor={colors.textLight}
        style={styles.textInput}
        editable={!savingAddress && !submitting}
      />

      <Text style={styles.inputLabel}>PHONE NUMBER *</Text>
      <TextInput
        value={addressForm.phone}
        onChangeText={(value) => {
          updateForm('phone', value);
          setSelectedPhone('');
        }}
        placeholder="03XXXXXXXXX"
        placeholderTextColor={colors.textLight}
        keyboardType="phone-pad"
        style={styles.textInput}
        editable={!savingAddress && !submitting}
      />

      {savedPhones.length > 0 && (
        <>
          <Text style={styles.inputLabel}>OR USE A SAVED NUMBER</Text>
          <View style={styles.phoneChoices}>
            {savedPhones.map((phone) => {
              const active =
                selectedPhone === phone.number &&
                addressForm.phone === phone.number;

              return (
                <TouchableOpacity
                  key={phone._id}
                  style={[
                    styles.phoneChoice,
                    active && styles.phoneChoiceActive,
                  ]}
                  onPress={() => {
                    setSelectedPhone(phone.number);
                    updateForm('phone', phone.number);
                  }}
                  disabled={savingAddress || submitting}
                >
                  <Ionicons
                    name="call-outline"
                    size={15}
                    color={active ? colors.secondary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.phoneChoiceText,
                      active && styles.phoneChoiceTextActive,
                    ]}
                  >
                    {phone.number}
                  </Text>
                  {phone.isPrimary && (
                    <Text style={styles.primaryPhoneText}>PRIMARY</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      <Text style={styles.inputLabel}>ALTERNATE PHONE (OPTIONAL)</Text>
      <TextInput
        value={addressForm.alternatePhone}
        onChangeText={(value) => updateForm('alternatePhone', value)}
        placeholder="Alternate contact number"
        placeholderTextColor={colors.textLight}
        keyboardType="phone-pad"
        style={styles.textInput}
        editable={!savingAddress && !submitting}
      />

      <Text style={styles.inputLabel}>COMPLETE STREET ADDRESS *</Text>
      <TextInput
        value={addressForm.address}
        onChangeText={(value) => updateForm('address', value)}
        placeholder="House, street, building or block"
        placeholderTextColor={colors.textLight}
        style={[styles.textInput, styles.multilineInput]}
        multiline
        textAlignVertical="top"
        editable={!savingAddress && !submitting}
      />

      <Text style={styles.inputLabel}>CITY *</Text>
      <TextInput
        value={addressForm.city}
        onChangeText={(value) => updateForm('city', value)}
        placeholder="Your city"
        placeholderTextColor={colors.textLight}
        style={styles.textInput}
        editable={!savingAddress && !submitting}
      />

      <Text style={styles.inputLabel}>AREA / NEIGHBORHOOD *</Text>
      <TextInput
        value={addressForm.area}
        onChangeText={(value) => updateForm('area', value)}
        placeholder="Your area or neighborhood"
        placeholderTextColor={colors.textLight}
        style={styles.textInput}
        editable={!savingAddress && !submitting}
      />

      <Text style={styles.inputLabel}>LANDMARK (OPTIONAL)</Text>
      <TextInput
        value={addressForm.landmark}
        onChangeText={(value) => updateForm('landmark', value)}
        placeholder="Nearby shop, school or landmark"
        placeholderTextColor={colors.textLight}
        style={styles.textInput}
        editable={!savingAddress && !submitting}
      />

      <TouchableOpacity
        style={[
          styles.saveAddressButton,
          savingAddress && styles.placeOrderButtonDisabled,
        ]}
        onPress={() => void saveAddressAndContinue()}
        disabled={savingAddress || submitting}
        activeOpacity={0.85}
      >
        {savingAddress ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Ionicons
            name="save-outline"
            size={18}
            color={colors.white}
          />
        )}
        <Text style={styles.saveAddressButtonText}>
          {savingAddress ? 'Saving address...' : 'Save Address & Continue'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.saveAddressNote}>
        Saving an edited address currently creates a new saved address because
        the existing API does not expose an address-update method.
      </Text>

      {savedAddresses.length > 0 && (
        <TouchableOpacity
          style={styles.cancelNewAddressButton}
          onPress={() => {
            const previousAddress =
              savedAddresses.find((address) => address._id === editingAddressId) ??
              savedAddresses.find((address) => address._id === selectedAddressId) ??
              savedAddresses.find((address) => address.isDefault) ??
              savedAddresses[0];

            if (previousAddress) {
              selectSavedAddress(previousAddress);
            } else {
              setIsAddingAddress(false);
              setEditingAddressId('');
            }
          }}
          disabled={savingAddress || submitting}
        >
          <Text style={styles.cancelNewAddressText}>
            Cancel and use a saved address
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.header,
            { paddingTop: Math.max(insets.top + 8, 16) },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bag-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>
            Add some food to your cart before checking out.
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.replace('/explore')}
          >
            <Text style={styles.exploreButtonText}>Explore Restaurants</Text>
            <Ionicons name="arrow-forward" size={17} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 145 },
        ]}
      >
        <View
          style={[
            styles.header,
            { paddingTop: Math.max(insets.top + 8, 16) },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={submitting}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>YOUR ORDER</Text>
            <Text style={styles.headerTitle}>Checkout</Text>
            <Text style={styles.headerSubtitle}>Almost there — good food awaits</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressContainer}>
            <View style={styles.progressStepActive}>
              <Ionicons name="cart" size={14} color={colors.white} />
            </View>
            <View style={styles.progressLineActive} />
            <View style={styles.progressStepActive}>
              <Ionicons name="location" size={14} color={colors.white} />
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <Ionicons name="checkmark" size={14} color={colors.textLight} />
            </View>
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelActive}>Cart</Text>
            <Text style={styles.progressLabelActive}>Delivery</Text>
            <Text style={styles.progressLabel}>Place order</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Where should we bring your food?
          </Text>
        </View>

        {loadingSavedInfo ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading saved details...</Text>
          </View>
        ) : (
          <>
            {savedInfoError ? (
              <View style={styles.errorCard}>
                <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
                <Text style={styles.errorHint}>{savedInfoError}</Text>
              </View>
            ) : null}

            {!isAddingAddress && savedAddresses.length > 0 && (
              <View style={styles.savedAddressList}>
                {savedAddresses.map((address) => {
                  const active = address._id === selectedAddressId;

                  return (
                    <View
                      key={address._id}
                      style={[
                        styles.addressCard,
                        active && styles.addressCardActive,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.addressSelectArea}
                        onPress={() => selectSavedAddress(address)}
                        activeOpacity={0.82}
                      >
                        <View
                          style={[
                            styles.addressIcon,
                            active && styles.addressIconActive,
                          ]}
                        >
                          <Ionicons
                            name={
                              address.label?.toLowerCase() === 'work'
                                ? 'briefcase-outline'
                                : 'location'
                            }
                            size={20}
                            color={active ? colors.white : colors.primary}
                          />
                        </View>

                        <View style={styles.addressContent}>
                          <View style={styles.addressTitleRow}>
                            <Text style={styles.addressLabel}>
                              {(address.label || 'SAVED ADDRESS').toUpperCase()}
                            </Text>
                            {address.isDefault && (
                              <Text style={styles.defaultBadge}>DEFAULT</Text>
                            )}
                            {active && (
                              <Text style={styles.selectedBadge}>SELECTED</Text>
                            )}
                          </View>

                          <Text style={styles.addressText}>
                            {address.recipientName}
                          </Text>
                          <Text style={styles.addressDetail}>
                            {address.address}
                          </Text>
                          <Text style={styles.addressDetail}>
                            {[address.area, address.city]
                              .filter(Boolean)
                              .join(', ')}
                          </Text>
                          <Text style={styles.addressDetail}>
                            {address.phone}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.radioOuter,
                            active && styles.radioOuterActive,
                          ]}
                        >
                          {active && <View style={styles.radioInner} />}
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.editAddressButton}
                        onPress={() => startEditingAddress(address)}
                        disabled={submitting || savingAddress}
                      >
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color={colors.primary}
                        />
                        <Text style={styles.editAddressText}>Edit Address</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {isAddingAddress ? (
              renderAddressForm()
            ) : (
              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={startNewAddress}
                activeOpacity={0.82}
              >
                <View style={styles.addAddressIcon}>
                  <Ionicons name="add" size={20} color={colors.white} />
                </View>
                <View style={styles.addAddressContent}>
                  <Text style={styles.addAddressText}>Add a new address</Text>
                  <Text style={styles.addAddressSubtitle}>
                    Deliver to a different location
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
              <Ionicons name="wallet-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Choose how you want to pay.
          </Text>
        </View>

        <View style={styles.paymentList}>
          {paymentMethods.map((method) => {
            const active = paymentMethod === method.id;
            const onlineMethod = method.id !== 'COD';

            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentCard,
                  active && styles.paymentCardActive,
                ]}
                onPress={() => setPaymentMethod(method.id)}
                activeOpacity={0.82}
              >
                <View
                  style={[
                    styles.paymentIcon,
                    active && styles.paymentIconActive,
                  ]}
                >
                  <Ionicons
                    name={method.icon}
                    size={21}
                    color={active ? colors.white : colors.textSecondary}
                  />
                </View>

                <View style={styles.paymentContent}>
                  <Text style={styles.paymentTitle}>{method.title}</Text>
                  <Text style={styles.paymentSubtitle}>{method.subtitle}</Text>
                  {onlineMethod && (
                    <Text style={styles.paymentUnavailable}>
                      <Ionicons name="time-outline" size={10} /> Not available yet
                    </Text>
                  )}
                </View>

                <View
                  style={[
                    styles.radioOuter,
                    active && styles.radioOuterActive,
                  ]}
                >
                  {active && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Order Note</Text>
            <Text style={styles.optionalBadge}>OPTIONAL</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Any special instructions for the restaurant?
          </Text>
        </View>

        <TextInput
          value={customerNote}
          onChangeText={setCustomerNote}
          placeholder="Less spicy, please call on arrival..."
          placeholderTextColor={colors.textLight}
          style={[styles.textInput, styles.noteInput]}
          multiline
          textAlignVertical="top"
          editable={!submitting}
        />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
              <Ionicons name="receipt-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} from{' '}
            {items[0].restaurantName}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryTopTitle}>Your items</Text>
            <Text style={styles.summaryTopCount}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>

          {items.map((item, index) => (
            <View
              key={`${item.id}-${index}`}
              style={styles.summaryItem}
            >
              <View style={styles.summaryQuantity}>
                <Text style={styles.summaryQuantityText}>
                  {item.quantity}×
                </Text>
              </View>
              <Text style={styles.summaryItemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.summaryItemPrice}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal (estimate)</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee (estimate)</Text>
            <Text
              style={[
                styles.summaryValue,
                estimatedDeliveryFee === 0 && styles.freeText,
              ]}
            >
              {estimatedDeliveryFee === 0
                ? 'FREE'
                : formatPrice(estimatedDeliveryFee)}
            </Text>
          </View>

          {estimatedDeliveryFee > 0 && subtotal < 1500 && (
            <View style={styles.freeDeliveryHint}>
              <Ionicons name="sparkles" size={14} color={colors.secondary} />
              <Text style={styles.freeDeliveryText}>
                Add {formatPrice(1500 - subtotal)} more for free delivery
              </Text>
            </View>
          )}

          <View style={styles.totalDivider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <Text style={styles.totalSubLabel}>Including estimated delivery</Text>
            </View>
            <Text style={styles.totalValue}>
              {formatPrice(estimatedTotal)}
            </Text>
          </View>

          <Text style={styles.estimateNote}>
            Final prices and delivery fee are confirmed by the server.
          </Text>
        </View>

        <View style={styles.secureCard}>
          <View style={styles.secureIcon}>
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={colors.secondary}
            />
          </View>
          <View style={styles.secureContent}>
            <Text style={styles.secureTitle}>You're in good hands</Text>
            <Text style={styles.secureText}>
              Your order is submitted securely. Track its status as soon as it's confirmed.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom + 10, 18) },
        ]}
      >
        <View style={styles.bottomTotal}>
          <View>
            <Text style={styles.bottomTotalLabel}>TOTAL ESTIMATE</Text>
            <Text style={styles.bottomTotalValue}>
              {formatPrice(estimatedTotal)}
            </Text>
          </View>
          <View style={styles.codPill}>
            <Ionicons name="cash-outline" size={14} color={colors.secondary} />
            <Text style={styles.codPillText}>
              {paymentMethod === 'COD' ? 'Cash on delivery' : 'Online payment'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          style={[
            styles.placeOrderButton,
            (submitting || loadingSavedInfo || savingAddress) &&
              styles.placeOrderButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={submitting || loadingSavedInfo || savingAddress}
        >
          {submitting ? (
            <>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.placeOrderText}>Placing order...</Text>
            </>
          ) : (
            <>
              <Ionicons name="lock-closed-outline" size={17} color={colors.white} />
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Ionicons
                name="arrow-forward"
                size={19}
                color={colors.white}
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerEyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 3,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },
  headerSpacer: {
    width: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepActive: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLineActive: {
    flex: 1,
    maxWidth: 90,
    height: 3,
    backgroundColor: colors.primary,
  },
  progressLine: {
    flex: 1,
    maxWidth: 90,
    height: 3,
    backgroundColor: colors.border,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  progressLabelActive: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  progressLabel: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    flexShrink: 1,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 7,
    lineHeight: 16,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorHint: {
    flex: 1,
    color: colors.warning,
    fontSize: 11,
    lineHeight: 16,
  },
  savedAddressList: {
    gap: spacing.sm,
  },
  addressCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  addressCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  addressSelectArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressIconActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  addressContent: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  addressLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  defaultBadge: {
    color: colors.black,
    backgroundColor: colors.secondary,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 7,
    fontWeight: '900',
    overflow: 'hidden',
  },
  selectedBadge: {
    color: colors.white,
    backgroundColor: colors.primary,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 7,
    fontWeight: '900',
    overflow: 'hidden',
  },
  addressText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 7,
  },
  addressDetail: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  editAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: spacing.md,
    marginLeft: 58,
    paddingVertical: 5,
  },
  editAddressText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  addAddressIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAddressContent: {
    flex: 1,
  },
  addAddressText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  addAddressSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  formHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  formHeadingIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formHeadingContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  formTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  formSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
    marginTop: spacing.md,
    marginBottom: 8,
  },
  textInput: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 12,
  },
  multilineInput: {
    minHeight: 82,
  },
  noteInput: {
    minHeight: 90,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    lineHeight: 18,
  },
  labelChoices: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  labelChoice: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  labelChoiceActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDark,
  },
  labelChoiceText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  labelChoiceTextActive: {
    color: colors.white,
  },
  phoneChoices: {
    gap: spacing.sm,
  },
  phoneChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  phoneChoiceActive: {
    borderColor: colors.secondary,
    backgroundColor: colors.surfaceAlt,
  },
  phoneChoiceText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  phoneChoiceTextActive: {
    color: colors.text,
  },
  primaryPhoneText: {
    color: colors.secondary,
    fontSize: 8,
    fontWeight: '900',
  },
  saveAddressButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  saveAddressButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  saveAddressNote: {
    color: colors.textLight,
    fontSize: 10,
    lineHeight: 15,
    marginTop: spacing.sm,
  },
  cancelNewAddressButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingVertical: 8,
  },
  cancelNewAddressText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  paymentList: {
    gap: spacing.sm,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  paymentCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  paymentIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentContent: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  paymentTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  paymentSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  paymentUnavailable: {
    color: colors.warning,
    fontSize: 9,
    marginTop: 5,
    fontWeight: '700',
  },
  radioOuter: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  optionalBadge: {
    color: colors.textLight,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryTopTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  summaryTopCount: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },
  summaryQuantity: {
    minWidth: 34,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  summaryQuantityText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
  },
  summaryItemName: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 11,
    marginRight: 8,
  },
  summaryItemPrice: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  freeText: {
    color: colors.secondary,
  },
  freeDeliveryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  freeDeliveryText: {
    flex: 1,
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  totalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  totalLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  totalSubLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 4,
  },
  totalValue: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: '900',
  },
  estimateNote: {
    color: colors.textLight,
    fontSize: 10,
    lineHeight: 15,
    marginTop: spacing.md,
  },
  secureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  secureIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  secureTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  secureText: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
    lineHeight: 15,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  bottomTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  bottomTotalLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  bottomTotalValue: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 3,
  },
  codPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.round,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  codPillText: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '800',
  },
  placeOrderButton: {
    minHeight: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
  placeOrderText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 94,
    height: 94,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 9,
    maxWidth: 280,
  },
  exploreButton: {
    minHeight: 50,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  exploreButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
});
