import React, { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';

import { colors, radius, spacing } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';
import type { UpdateProfileData } from '../services/auth/authApi';

type ProfileFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  onChangeText: (value: string) => void;
};

function ProfileField({
  label,
  value,
  placeholder,
  icon,
  keyboardType = 'default',
  onChangeText,
}: ProfileFieldProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={19} color={colors.secondary} />
        <TextInput
          style={styles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          keyboardType={keyboardType}
          autoCapitalize="none"
          onChangeText={onChangeText}
          selectionColor={colors.secondary}
        />
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [secondaryPhone, setSecondaryPhone] = useState(
    user?.secondaryPhone ?? ''
  );
  const [address, setAddress] = useState(user?.address ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [area, setArea] = useState(user?.area ?? '');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    setSecondaryPhone(user?.secondaryPhone ?? '');
    setAddress(user?.address ?? '');
    setCity(user?.city ?? '');
    setArea(user?.area ?? '');
  }, [
    user?.name,
    user?.phone,
    user?.secondaryPhone,
    user?.address,
    user?.city,
    user?.area,
  ]);

  const showMessage = (message: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.alert(message);
      }
    } else {
      Alert.alert('FoodDash', message);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/account');
    }
  };

  const handleSave = async () => {
    if (!user) {
      showMessage('Please log in to edit your profile.');
      router.replace('/login');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Please enter your primary phone number.');
      return;
    }

    setErrorMessage('');

    const data: UpdateProfileData = {
      name: name.trim(),
      phone: phone.trim(),
      secondaryPhone: secondaryPhone.trim(),
      address: address.trim(),
      city: city.trim(),
      area: area.trim(),
    };

    try {
      await updateProfile(data);
      showMessage('Your profile has been updated successfully.');
      goBack();
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to update your profile. Please try again.'
      );
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingIcon}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
        <Text style={styles.loadingText}>Preparing your profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIcon}>
          <Ionicons name="person-outline" size={34} color={colors.secondary} />
        </View>
        <Text style={styles.emptyEyebrow}>YOUR ACCOUNT</Text>
        <Text style={styles.emptyTitle}>Your account awaits</Text>
        <Text style={styles.emptyDescription}>
          Sign in to manage your personal information and delivery details.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.replace('/login')}
        >
          <Ionicons name="log-in-outline" size={20} color={colors.black} />
          <Text style={styles.primaryButtonText}>Log In</Text>
        </Pressable>
      </View>
    );
  }

  const initials = user.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.controlPressed,
          ]}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerEyebrow}>YOUR ACCOUNT</Text>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="person-outline" size={21} color={colors.primary} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroAccent} />
          <View style={styles.heroGlow} />

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || 'U'}</Text>
            <View style={styles.avatarStatus}>
              <Ionicons
                name="checkmark"
                size={11}
                color={colors.black}
              />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileEyebrow}>WELCOME BACK</Text>
            <Text style={styles.profileName} numberOfLines={2}>
              {user.name}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={2}>
              {user.email}
            </Text>

            <View style={styles.accountBadge}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={colors.secondary}
              />
              <Text style={styles.accountBadgeText}>
                {user.role.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          <View style={styles.heroDecoration}>
            <Ionicons
              name="person-circle-outline"
              size={76}
              color={colors.primary}
            />
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.sectionHeadingText}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Text style={styles.sectionSubtitle}>
              Tell us how to reach you
            </Text>
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>01</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <ProfileField
            label="FULL NAME *"
            value={name}
            placeholder="Enter your full name"
            icon="person-outline"
            onChangeText={setName}
          />

          <View style={styles.separator} />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={[styles.inputWrapper, styles.disabledInput]}>
              <Ionicons name="mail-outline" size={19} color={colors.textLight} />
              <TextInput
                style={styles.input}
                value={user.email}
                editable={false}
                selectTextOnFocus={false}
                placeholderTextColor={colors.textLight}
              />
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={colors.textLight}
              />
            </View>
            <Text style={styles.helperText}>
              Your email address cannot be changed here.
            </Text>
          </View>

          <View style={styles.separator} />

          <ProfileField
            label="PRIMARY PHONE *"
            value={phone}
            placeholder="Enter your phone number"
            icon="call-outline"
            keyboardType="phone-pad"
            onChangeText={setPhone}
          />

          <View style={styles.separator} />

          <ProfileField
            label="SECONDARY PHONE"
            value={secondaryPhone}
            placeholder="Optional alternate number"
            icon="call-outline"
            keyboardType="phone-pad"
            onChangeText={setSecondaryPhone}
          />
        </View>

        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.sectionHeadingText}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <Text style={styles.sectionSubtitle}>
              Your main delivery location
            </Text>
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>02</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <ProfileField
            label="STREET ADDRESS"
            value={address}
            placeholder="House number, street, building"
            icon="navigate-outline"
            onChangeText={setAddress}
          />

          <View style={styles.separator} />

          <ProfileField
            label="CITY"
            value={city}
            placeholder="Enter your city"
            icon="business-outline"
            onChangeText={setCity}
          />

          <View style={styles.separator} />

          <ProfileField
            label="AREA / NEIGHBORHOOD"
            value={area}
            placeholder="Enter your area"
            icon="map-outline"
            onChangeText={setArea}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.addressLink,
            pressed && styles.controlPressed,
          ]}
          onPress={() => router.push('/addresses')}
          accessibilityRole="button"
        >
          <View style={styles.addressLinkIcon}>
            <Ionicons name="location" size={21} color={colors.secondary} />
          </View>
          <View style={styles.addressLinkText}>
            <Text style={styles.addressLinkTitle}>
              Saved delivery addresses
            </Text>
            <Text style={styles.addressLinkSubtitle}>
              Manage multiple addresses separately
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={19}
            color={colors.textSecondary}
          />
        </Pressable>

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.secondary}
          />
          <Text style={styles.infoText}>
            Your primary profile details help us manage your account and
            deliveries. Your saved addresses are managed separately.
          </Text>
        </View>

        {!!errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={colors.danger}
            />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && !isLoading && styles.buttonPressed,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={() => void handleSave()}
          disabled={isLoading}
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator color={colors.black} />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color={colors.black}
              />
              <Text style={styles.primaryButtonText}>Save Changes</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.controlPressed,
          ]}
          onPress={goBack}
          disabled={isLoading}
          accessibilityRole="button"
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>

        <View style={styles.footerNote}>
          <Ionicons
            name="lock-closed-outline"
            size={12}
            color={colors.textLight}
          />
          <Text style={styles.footerNoteText}>
            Your information is handled securely.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 14,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'web' ? spacing.lg : 54,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 13,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerEyebrow: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 44,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 21,
    gap: 15,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 29,
  },
  heroAccent: {
    position: 'absolute',
    left: 0,
    top: 18,
    bottom: 18,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: colors.primary,
  },
  heroGlow: {
    position: 'absolute',
    right: -50,
    top: -65,
    width: 155,
    height: 155,
    borderRadius: 78,
    backgroundColor: colors.primary,
    opacity: 0.09,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: {
    color: colors.secondary,
    fontSize: 24,
    fontWeight: '900',
  },
  avatarStatus: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 21,
    height: 21,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileEyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 5,
  },
  profileName: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  profileEmail: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountBadgeText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroDecoration: {
    position: 'absolute',
    right: 8,
    bottom: 3,
    opacity: 0.08,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 13,
  },
  sectionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeadingText: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepText: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 28,
  },
  fieldContainer: {
    paddingVertical: 14,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 9,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 51,
    paddingHorizontal: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: 11,
  },
  disabledInput: {
    backgroundColor: colors.surfaceAlt,
    opacity: 0.8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    outlineStyle: 'none',
  } as any,
  helperText: {
    color: colors.textLight,
    fontSize: 11,
    marginTop: 7,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  addressLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 17,
  },
  addressLinkIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressLinkText: {
    flex: 1,
  },
  addressLinkTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  addressLinkSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    marginBottom: 18,
  },
  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 13,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
    gap: 9,
    marginBottom: 15,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    minHeight: 55,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: colors.black,
    fontSize: 15,
    fontWeight: '900',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  controlPressed: {
    opacity: 0.75,
  },
  cancelButton: {
    minHeight: 47,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: radius.lg,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 7,
  },
  footerNoteText: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 18,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyEyebrow: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 7,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
    marginBottom: 23,
    maxWidth: 340,
  },
});
