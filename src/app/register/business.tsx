import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import RestaurantImagePicker from '../../components/RestaurantImagePicker';

export default function BusinessRegisterScreen() {
  const registerBusiness = useAuthStore(
    (state) => state.registerBusiness
  );

  const isLoading = useAuthStore(
    (state) => state.isLoading
  );

  const [ownerName, setOwnerName] = useState('');
  const [ownerMobileNumber, setOwnerMobileNumber] =
    useState('');
  const [email, setEmail] = useState('');
  const [completeAddress, setCompleteAddress] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [restaurantLogo, setRestaurantLogo] = useState('');

  const handleRegister = async () => {
    const cleanOwnerName = ownerName.trim();
    const cleanOwnerMobile = ownerMobileNumber.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanAddress = completeAddress.trim();
    const cleanCity = city.trim();
    const cleanArea = area.trim();
    const cleanLoginEmail = loginEmail.trim().toLowerCase();

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (
      !cleanOwnerName ||
      !cleanOwnerMobile ||
      !cleanEmail ||
      !cleanAddress ||
      !cleanCity ||
      !cleanArea ||
      !latitude.trim() ||
      !longitude.trim() ||
      !cleanLoginEmail ||
      !password ||
      !confirmPassword
    ) {
      Toast.show({
        type: 'error',
        text1: 'Missing information',
        text2: 'Please complete all required fields.',
      });
      return;
    }

    if (
      Number.isNaN(parsedLatitude) ||
      parsedLatitude < -90 ||
      parsedLatitude > 90
    ) {
      Toast.show({
        type: 'error',
        text1: 'Invalid latitude',
        text2: 'Latitude must be between -90 and 90.',
      });
      return;
    }

    if (
      Number.isNaN(parsedLongitude) ||
      parsedLongitude < -180 ||
      parsedLongitude > 180
    ) {
      Toast.show({
        type: 'error',
        text1: 'Invalid longitude',
        text2: 'Longitude must be between -180 and 180.',
      });
      return;
    }

    if (password.length < 8) {
      Toast.show({
        type: 'error',
        text1: 'Password too short',
        text2: 'Password must be at least 8 characters.',
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Passwords do not match',
        text2: 'Please enter the same password twice.',
      });
      return;
    }

    try {
      const user = await registerBusiness({
        ownerName: cleanOwnerName,
        ownerMobileNumber: cleanOwnerMobile,
        email: cleanEmail,
        completeAddress: cleanAddress,
        city: cleanCity,
        area: cleanArea,
        restaurantLocation: {
          type: 'Point',
          coordinates: [parsedLongitude, parsedLatitude],
        },
        loginEmail: cleanLoginEmail,
        password,
        logo: restaurantLogo,
      });

      Toast.show({
        type: 'success',
        text1: 'Application submitted!',
        text2:
          'Your business application is waiting for admin approval.',
      });

      if (
        user.role === 'BUSINESS' &&
        user.status === 'PENDING'
      ) {
        router.replace('/business-pending');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Unable to submit your business application. Please try again.',
      });
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={colors.text}
            />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons
                name="storefront"
                size={34}
                color={colors.black}
              />
            </View>

            <Text style={styles.eyebrow}>
              PARTNER WITH FOODDASH
            </Text>

            <Text style={styles.title}>
              Bring your food to more people.
            </Text>

            <Text style={styles.subtitle}>
              Register your restaurant and apply to join
              the FoodDash marketplace.
            </Text>

            <View style={styles.reviewBadge}>
              <Ionicons
                name="shield-checkmark-outline"
                size={15}
                color={colors.secondary}
              />
              <Text style={styles.reviewBadgeText}>
                Admin-reviewed application
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeading
              icon="image-outline"
              title="Restaurant picture"
              subtitle="Give customers a first look at your brand."
            />

            <RestaurantImagePicker
              label="Restaurant Logo"
              description="Choose a clear image representing your restaurant."
              imageUrl={restaurantLogo || undefined}
              onChange={setRestaurantLogo}
            />
          </View>

          <View style={styles.section}>
            <SectionHeading
              icon="person-outline"
              title="Owner information"
              subtitle="Provide the contact details for the owner."
            />

            <Field
              label="Owner Name"
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="Enter owner's full name"
              icon="person-outline"
              editable={!isLoading}
            />

            <Field
              label="Owner Mobile Number"
              value={ownerMobileNumber}
              onChangeText={setOwnerMobileNumber}
              placeholder="03XXXXXXXXX"
              icon="call-outline"
              keyboardType="phone-pad"
              editable={!isLoading}
            />

            <Field
              label="Contact Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Business contact email"
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.section}>
            <SectionHeading
              icon="location-outline"
              title="Business location"
              subtitle="Help customers discover your restaurant nearby."
            />

            <Field
              label="City"
              value={city}
              onChangeText={setCity}
              placeholder="Enter city"
              icon="business-outline"
              editable={!isLoading}
            />

            <Field
              label="Area"
              value={area}
              onChangeText={setArea}
              placeholder="Enter area or neighbourhood"
              icon="navigate-outline"
              editable={!isLoading}
            />

            <Field
              label="Complete Address"
              value={completeAddress}
              onChangeText={setCompleteAddress}
              placeholder="Street, building, and nearby landmark"
              icon="map-outline"
              multiline
              editable={!isLoading}
            />

            <View style={styles.coordinatesHeading}>
              <Ionicons
                name="pin-outline"
                size={17}
                color={colors.secondary}
              />
              <Text style={styles.coordinatesTitle}>
                Restaurant coordinates
              </Text>
            </View>

            <Text style={styles.locationDescription}>
              Enter valid latitude and longitude values for
              nearby-restaurant discovery.
            </Text>

            <View style={styles.coordinateRow}>
              <View style={styles.coordinateField}>
                <Field
                  label="Latitude"
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholder="30.1575"
                  icon="compass-outline"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.coordinateField}>
                <Field
                  label="Longitude"
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholder="71.5249"
                  icon="compass-outline"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeading
              icon="lock-closed-outline"
              title="Account security"
              subtitle="These credentials will be used to sign in."
            />

            <Field
              label="Login Email"
              value={loginEmail}
              onChangeText={setLoginEmail}
              placeholder="Email used to sign in"
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />

            <PasswordField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              visible={showPassword}
              onToggle={() =>
                setShowPassword((current) => !current)
              }
              editable={!isLoading}
            />

            <PasswordField
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Enter password again"
              visible={showConfirmPassword}
              onToggle={() =>
                setShowConfirmPassword((current) => !current)
              }
              editable={!isLoading}
            />

            <View style={styles.passwordHint}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.textLight}
              />
              <Text style={styles.passwordHintText}>
                Use at least 8 characters for your password.
              </Text>
            </View>
          </View>

          <View style={styles.notice}>
            <View style={styles.noticeIconWrap}>
              <Ionicons
                name="time-outline"
                size={21}
                color={colors.secondary}
              />
            </View>

            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>
                What happens next?
              </Text>
              <Text style={styles.noticeText}>
                Your application will remain pending until
                an administrator reviews it. Once approved,
                your restaurant will be created automatically.
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && !isLoading && styles.buttonPressed,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color={colors.black} />
                <Text style={styles.submitButtonText}>
                  Submitting application...
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.submitButtonText}>
                  Submit Business Application
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color={colors.black}
                />
              </>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?
            </Text>

            <Pressable
              onPress={() => router.push('/login')}
              disabled={isLoading}
              hitSlop={8}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </Pressable>
          </View>

          <Text style={styles.footerBrand}>
            MADE FOR YOUR NEXT CRAVING
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  keyboardType?:
    | 'default'
    | 'email-address'
    | 'phone-pad'
    | 'number-pad'
    | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  multiline?: boolean;
  editable?: boolean;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  multiline = false,
  editable = true,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputWrapper,
          multiline && styles.multilineWrapper,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={colors.textLight}
            style={[
              styles.inputIcon,
              multiline && styles.multilineIcon,
            ]}
          />
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          editable={editable}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[
            styles.input,
            multiline && styles.multilineInput,
          ]}
        />
      </View>
    </View>
  );
}

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
  editable?: boolean;
};

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  visible,
  onToggle,
  editable = true,
}: PasswordFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.passwordWrapper}>
        <Ionicons
          name="lock-closed-outline"
          size={18}
          color={colors.textLight}
          style={styles.inputIcon}
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={!visible}
          editable={editable}
          style={styles.passwordInput}
        />

        <Pressable
          style={styles.eyeButton}
          onPress={onToggle}
          disabled={!editable}
          hitSlop={8}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={21}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

type SectionHeadingProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
};

function SectionHeading({
  icon,
  title,
  subtitle,
}: SectionHeadingProps) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <View style={styles.sectionHeadingText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingRight: spacing.md,
    gap: spacing.sm,
  },

  backText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },

  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    transform: [{ rotate: '-5deg' }],
  },

  eyebrow: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },

  title: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 370,
  },

  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
  },

  reviewBadgeText: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '800',
  },

  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeadingText: {
    flex: 1,
    paddingTop: 2,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },

  sectionSubtitle: {
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 18,
  },

  field: {
    marginBottom: spacing.lg,
  },

  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },

  inputWrapper: {
    minHeight: 53,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },

  multilineWrapper: {
    alignItems: 'flex-start',
    paddingTop: spacing.md,
  },

  inputIcon: {
    marginRight: spacing.sm,
  },

  multilineIcon: {
    marginTop: 2,
  },

  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 51,
    color: colors.text,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },

  multilineInput: {
    minHeight: 94,
    paddingTop: 0,
    paddingBottom: spacing.sm,
  },

  passwordWrapper: {
    minHeight: 53,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
  },

  passwordInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 51,
    color: colors.text,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },

  eyeButton: {
    width: 46,
    minHeight: 51,
    alignItems: 'center',
    justifyContent: 'center',
  },

  coordinatesHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },

  coordinatesTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  locationDescription: {
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },

  coordinateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  coordinateField: {
    flex: 1,
    minWidth: 0,
  },

  passwordHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: -spacing.sm,
  },

  passwordHintText: {
    flex: 1,
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 17,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },

  noticeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  noticeContent: {
    flex: 1,
  },

  noticeTitle: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },

  noticeText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },

  submitButton: {
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  submitButtonText: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },

  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },

  footerText: {
    color: colors.textLight,
    fontSize: 13,
  },

  loginLink: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '900',
  },

  footerBrand: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
