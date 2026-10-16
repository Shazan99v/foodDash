import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import {
  addSavedAddress,
  deleteSavedAddress,
  getSavedAddresses,
  setDefaultAddress,
  updateSavedAddress,
  type SavedAddress,
  type AddSavedAddressData,
} from '../services/auth/authApi';

import {
  colors,
  spacing,
  radius,
  typography,
} from '../constants/theme';

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

const emptyForm: AddressForm = {
  label: 'Home',
  recipientName: '',
  phone: '',
  alternatePhone: '',
  address: '',
  city: '',
  area: '',
  landmark: '',
};

const addressToForm = (address: SavedAddress): AddressForm => ({
  label: address.label || 'Home',
  recipientName: address.recipientName || '',
  phone: address.phone || '',
  alternatePhone: address.alternatePhone || '',
  address: address.address || '',
  city: address.city || '',
  area: address.area || '',
  landmark: address.landmark || '',
});

export default function AddressesScreen() {
  const router = useRouter();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [error, setError] = useState('');

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getSavedAddresses();
      setAddresses(result);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to load your saved addresses.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAddresses();
    }, [loadAddresses]),
  );

  const updateField = (field: keyof AddressForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setFormVisible(true);
  };

  const startEdit = (address: SavedAddress) => {
    setEditingId(address._id);
    setForm(addressToForm(address));
    setError('');
    setFormVisible(true);
  };

  const cancelForm = () => {
    setFormVisible(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const saveAddress = async () => {
    const requiredFields: (keyof AddressForm)[] = [
      'label',
      'address',
      'city',
      'area',
    ];

    for (const field of requiredFields) {
      if (!form[field].trim()) {
        setError(
          `${field === 'label' ? 'Address label' : field[0].toUpperCase() + field.slice(1)} is required.`,
        );
        return;
      }
    }

    if (form.phone.trim().length > 30) {
      setError('Phone number cannot exceed 30 characters.');
      return;
    }

    if (form.alternatePhone.trim().length > 30) {
      setError('Alternate phone cannot exceed 30 characters.');
      return;
    }

    setSaving(true);
    setError('');

    const payload: AddSavedAddressData = {
      label: form.label.trim(),
      recipientName: form.recipientName.trim(),
      phone: form.phone.trim(),
      alternatePhone: form.alternatePhone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      area: form.area.trim(),
      landmark: form.landmark.trim(),
    };

    try {
      if (editingId) {
        await updateSavedAddress(editingId, payload);
      } else {
        await addSavedAddress({
          ...payload,
          isDefault: addresses.length === 0,
        });
      }

      cancelForm();
      await loadAddresses();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to save this address.',
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (address: SavedAddress) => {
    const performDelete = async () => {
      setDeletingId(address._id);

      try {
        await deleteSavedAddress(address._id);
        await loadAddresses();
      } catch (err: any) {
        Alert.alert(
          'Could not delete address',
          err?.response?.data?.message || 'Please try again.',
        );
      } finally {
        setDeletingId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm(`Delete the ${address.label} address?`)
      ) {
        void performDelete();
      }
      return;
    }

    Alert.alert(
      'Delete address?',
      `Are you sure you want to delete your ${address.label} address?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void performDelete(),
        },
      ],
    );
  };

  const makeDefault = async (address: SavedAddress) => {
    try {
      await setDefaultAddress(address._id);
      await loadAddresses();
    } catch (err: any) {
      Alert.alert(
        'Could not update address',
        err?.response?.data?.message || 'Please try again.',
      );
    }
  };

  const renderField = (
    label: string,
    field: keyof AddressForm,
    placeholder: string,
    options?: {
      required?: boolean;
      multiline?: boolean;
      keyboardType?: 'default' | 'phone-pad';
    },
  ) => (
    <View style={styles.field} key={field}>
      <Text style={styles.fieldLabel}>
        {label}
        {options?.required ? ' *' : ''}
      </Text>

      <TextInput
        value={form[field]}
        onChangeText={(value) => updateField(field, value)}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        style={[
          styles.input,
          options?.multiline && styles.multilineInput,
        ]}
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline || false}
        textAlignVertical={options?.multiline ? 'top' : 'center'}
        editable={!saving}
        maxLength={
          field === 'address'
            ? 300
            : field === 'landmark'
              ? 200
              : field === 'recipientName'
                ? 100
                : undefined
        }
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color={colors.text}
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerEyebrow}>YOUR ACCOUNT</Text>
          <Text style={styles.headerTitle}>Delivery addresses</Text>
          <Text style={styles.headerSubtitle}>
            Choose where your food arrives
          </Text>
        </View>

        {!formVisible && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add address"
            onPress={startAdd}
            style={({ pressed }) => [
              styles.headerAddButton,
              pressed && styles.pressedPrimary,
            ]}
          >
            <Ionicons
              name="add"
              size={25}
              color={colors.black}
            />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {formVisible ? (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <View style={styles.formHeaderIcon}>
                <Ionicons
                  name={editingId ? 'create-outline' : 'location-outline'}
                  size={23}
                  color={colors.primary}
                />
              </View>

              <View style={styles.formHeaderText}>
                <Text style={styles.sectionTitle}>
                  {editingId ? 'Edit address' : 'Add a new address'}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Fields marked with * are required.
                </Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Address type *</Text>

            <View style={styles.labelOptions}>
              {['Home', 'Work', 'Other'].map((label) => {
                const active = form.label === label;

                return (
                  <Pressable
                    key={label}
                    onPress={() => updateField('label', label)}
                    disabled={saving}
                    style={[
                      styles.labelOption,
                      active && styles.labelOptionActive,
                    ]}
                  >
                    <Ionicons
                      name={
                        label === 'Home'
                          ? 'home-outline'
                          : label === 'Work'
                            ? 'briefcase-outline'
                            : 'location-outline'
                      }
                      size={17}
                      color={active ? colors.primary : colors.textSecondary}
                    />

                    <Text
                      style={[
                        styles.labelOptionText,
                        active && styles.labelOptionTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {renderField(
              'Recipient name',
              'recipientName',
              'Who receives the order?',
            )}

            {renderField('Phone number', 'phone', 'Contact number', {
              keyboardType: 'phone-pad',
            })}

            {renderField(
              'Alternate phone',
              'alternatePhone',
              'Optional backup number',
              { keyboardType: 'phone-pad' },
            )}

            {renderField(
              'Complete address',
              'address',
              'House, street, building...',
              { required: true, multiline: true },
            )}

            {renderField(
              'Area / neighbourhood',
              'area',
              'Your area',
              { required: true },
            )}

            {renderField('City', 'city', 'Your city', {
              required: true,
            })}

            {renderField(
              'Landmark',
              'landmark',
              'Nearby shop or landmark (optional)',
            )}

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={19}
                  color={colors.danger}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={() => void saveAddress()}
              disabled={saving}
              style={({ pressed }) => [
                styles.primaryButton,
                saving && styles.disabledButton,
                pressed && !saving && styles.pressedPrimary,
              ]}
            >
              {saving ? (
                <ActivityIndicator color={colors.black} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={21}
                    color={colors.black}
                  />
                  <Text style={styles.primaryButtonText}>
                    {editingId ? 'Save changes' : 'Save address'}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={cancelForm}
              disabled={saving}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.introCard}>
              <View style={styles.introIcon}>
                <Ionicons
                  name="navigate-outline"
                  size={25}
                  color={colors.primary}
                />
              </View>

              <View style={styles.introText}>
                <Text style={styles.introTitle}>
                  Your places, your choice
                </Text>
                <Text style={styles.introSubtitle}>
                  Save home, work, and other delivery locations for
                  a smoother checkout.
                </Text>
              </View>
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={19}
                  color={colors.danger}
                />
                <Text style={styles.errorText}>{error}</Text>

                <Pressable onPress={() => void loadAddresses()}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            )}

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                />
                <Text style={styles.loadingText}>
                  Loading your addresses...
                </Text>
              </View>
            ) : addresses.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="location-outline"
                    size={33}
                    color={colors.primary}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  No saved addresses yet
                </Text>

                <Text style={styles.emptySubtitle}>
                  Add a delivery address to make your next order
                  quicker and easier.
                </Text>

                <Pressable
                  accessibilityRole="button"
                  onPress={startAdd}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.pressedPrimary,
                  ]}
                >
                  <Ionicons
                    name="add"
                    size={21}
                    color={colors.black}
                  />
                  <Text style={styles.primaryButtonText}>
                    Add your first address
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.addressList}>
                <View style={styles.listHeadingRow}>
                  <Text style={styles.listHeading}>
                    SAVED LOCATIONS
                  </Text>

                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {addresses.length}
                    </Text>
                  </View>
                </View>

                {addresses.map((address) => (
                  <View key={address._id} style={styles.addressCard}>
                    <View style={styles.addressCardTop}>
                      <View style={styles.addressTypeIcon}>
                        <Ionicons
                          name={
                            address.label?.toLowerCase() === 'work'
                              ? 'briefcase-outline'
                              : address.label?.toLowerCase() === 'home'
                                ? 'home-outline'
                                : 'location-outline'
                          }
                          size={22}
                          color={colors.primary}
                        />
                      </View>

                      <View style={styles.addressMain}>
                        <View style={styles.addressTitleRow}>
                          <Text style={styles.addressLabel}>
                            {address.label || 'Address'}
                          </Text>

                          {address.isDefault && (
                            <View style={styles.defaultBadge}>
                              <Ionicons
                                name="checkmark-circle"
                                size={12}
                                color={colors.secondary}
                              />
                              <Text style={styles.defaultBadgeText}>
                                DEFAULT
                              </Text>
                            </View>
                          )}
                        </View>

                        {!!address.recipientName && (
                          <Text style={styles.recipientName}>
                            {address.recipientName}
                          </Text>
                        )}

                        <Text style={styles.addressLine}>
                          {address.address}
                        </Text>

                        <Text style={styles.addressMeta}>
                          {[address.area, address.city]
                            .filter(Boolean)
                            .join(', ')}
                        </Text>

                        {!!address.landmark && (
                          <View style={styles.detailRow}>
                            <Ionicons
                              name="navigate-outline"
                              size={14}
                              color={colors.textLight}
                            />
                            <Text style={styles.addressMeta}>
                              {address.landmark}
                            </Text>
                          </View>
                        )}

                        {!!address.phone && (
                          <View style={styles.detailRow}>
                            <Ionicons
                              name="call-outline"
                              size={14}
                              color={colors.textLight}
                            />
                            <Text style={styles.addressMeta}>
                              {address.phone}
                            </Text>
                          </View>
                        )}

                        {!!address.alternatePhone && (
                          <View style={styles.detailRow}>
                            <Ionicons
                              name="call-outline"
                              size={14}
                              color={colors.textLight}
                            />
                            <Text style={styles.addressMeta}>
                              {address.alternatePhone}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.addressActions}>
                      {!address.isDefault ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => void makeDefault(address)}
                          style={styles.actionButton}
                        >
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={17}
                            color={colors.secondary}
                          />
                          <Text style={styles.actionText}>
                            Set default
                          </Text>
                        </Pressable>
                      ) : (
                        <View style={styles.defaultIndicator}>
                          <Ionicons
                            name="checkmark-circle"
                            size={17}
                            color={colors.secondary}
                          />
                          <Text style={styles.defaultIndicatorText}>
                            Selected by default
                          </Text>
                        </View>
                      )}

                      <View style={styles.actionSpacer} />

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${address.label} address`}
                        onPress={() => startEdit(address)}
                        style={styles.iconAction}
                      >
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.actionText}>Edit</Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${address.label} address`}
                        disabled={deletingId === address._id}
                        onPress={() => confirmDelete(address)}
                        style={styles.iconAction}
                      >
                        {deletingId === address._id ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.danger}
                          />
                        ) : (
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={colors.danger}
                          />
                        )}

                        <Text style={styles.deleteText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}

                <Pressable
                  accessibilityRole="button"
                  onPress={startAdd}
                  style={({ pressed }) => [
                    styles.addAnotherButton,
                    pressed && styles.addAnotherButtonPressed,
                  ]}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={22}
                    color={colors.primary}
                  />
                  <Text style={styles.addAnotherText}>
                    Add another address
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'web' ? spacing.lg : 54,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  headerText: {
    flex: 1,
  },

  headerEyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 3,
  },

  headerTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.small,
    marginTop: 3,
  },

  headerAddButton: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressed: {
    opacity: 0.7,
  },

  pressedPrimary: {
    backgroundColor: colors.primaryDark,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: 48,
    gap: spacing.lg,
  },

  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },

  introIcon: {
    width: 49,
    height: 49,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 107, 26, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 26, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  introText: {
    flex: 1,
  },

  introTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  introSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: 4,
  },

  formCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },

  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },

  formHeaderIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 107, 26, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  formHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.small,
    marginTop: 4,
  },

  field: {
    gap: spacing.sm,
  },

  fieldLabel: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '800',
  },

  input: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    backgroundColor: colors.primaryDark,
    fontSize: typography.body,
  },

  multilineInput: {
    minHeight: 90,
    paddingTop: spacing.md,
  },

  labelOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  labelOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryDark,
  },

  labelOptionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 107, 26, 0.10)',
  },

  labelOptionText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '700',
  },

  labelOptionTextActive: {
    color: colors.primary,
  },

  primaryButton: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },

  primaryButtonText: {
    color: colors.black,
    fontSize: typography.body,
    fontWeight: '900',
  },

  disabledButton: {
    opacity: 0.65,
  },

  cancelButton: {
    minHeight: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: '800',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 98, 104, 0.35)',
    backgroundColor: 'rgba(255, 98, 104, 0.08)',
    borderRadius: radius.md,
  },

  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: typography.small,
    lineHeight: 19,
  },

  retryText: {
    color: colors.primary,
    fontWeight: '900',
  },

  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: 60,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },

  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 26, 0.12)',
    marginBottom: spacing.lg,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptySubtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  addressList: {
    gap: spacing.md,
  },

  listHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },

  listHeading: {
    color: colors.textLight,
    fontSize: typography.tiny,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  countBadge: {
    minWidth: 23,
    height: 23,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },

  countBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },

  addressCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  addressCardTop: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  addressTypeIcon: {
    width: 45,
    height: 45,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 107, 26, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addressMain: {
    flex: 1,
    gap: 6,
  },

  addressTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },

  addressLabel: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '900',
  },

  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(198, 245, 74, 0.08)',
    borderColor: 'rgba(198, 245, 74, 0.30)',
    borderWidth: 1,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },

  defaultBadgeText: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  recipientName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },

  addressLine: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },

  addressMeta: {
    color: colors.textLight,
    fontSize: typography.small,
    lineHeight: 19,
    flexShrink: 1,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  addressActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: spacing.xs,
  },

  actionSpacer: {
    flex: 1,
    minWidth: 0,
  },

  iconAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: spacing.xs,
  },

  actionText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '800',
  },

  deleteText: {
    color: colors.danger,
    fontSize: typography.small,
    fontWeight: '800',
  },

  defaultIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  defaultIndicatorText: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
  },

  addAnotherButton: {
    minHeight: 53,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    marginTop: spacing.xs,
  },

  addAnotherButtonPressed: {
    backgroundColor: 'rgba(255, 107, 26, 0.08)',
  },

  addAnotherText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: typography.body,
  },
});
