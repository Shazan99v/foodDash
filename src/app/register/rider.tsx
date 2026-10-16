import React, { useState } from 'react';

import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import {
  RiderRegisterData,
  uploadVehiclePhoto,
} from '../../services/auth/authApi';

import { useAuthStore } from '../../stores/authStore';

import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';

export default function RiderRegisterScreen() {
  const registerRider = useAuthStore(
    (state) => state.registerRider
  );

  const isLoading = useAuthStore(
    (state) => state.isLoading
  );

  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [fatherMobileNumber, setFatherMobileNumber] =
    useState('');
  const [email, setEmail] = useState('');
  const [cnic, setCnic] = useState('');

  const [vehicleType, setVehicleType] =
    useState<'BIKE' | 'CYCLE'>('BIKE');

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehiclePhoto, setVehiclePhoto] =
    useState<string | null>(null);
  const [vehiclePhotoPreview, setVehiclePhotoPreview] =
    useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] =
    useState(false);

  const [drivingLicenseNumber, setDrivingLicenseNumber] =
    useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [completeAddress, setCompleteAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [dailyWorkingHours, setDailyWorkingHours] =
    useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const showError = (message: string) => {
    Toast.show({
      type: 'error',
      text1: 'Registration Error',
      text2: message,
    });
  };

  const handleSelectedPhoto = async (
    asset: ImagePicker.ImagePickerAsset
  ) => {
    setVehiclePhotoPreview(asset.uri);
    setIsUploadingPhoto(true);

    try {
      const uploadedPhotoUrl = await uploadVehiclePhoto(asset);

      setVehiclePhoto(uploadedPhotoUrl);

      Toast.show({
        type: 'success',
        text1: 'Photo Uploaded',
        text2: 'Your vehicle photo has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Vehicle photo upload error:', error);

      setVehiclePhoto(null);
      setVehiclePhotoPreview(null);

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to upload the vehicle photo. Please try again.';

      showError(message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const requestCameraPermission =
    async (): Promise<boolean> => {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        showError(
          'Camera permission is required to take a vehicle photo.'
        );
        return false;
      }

      return true;
    };

  const chooseVehiclePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showError(
          'Photo library permission is required to choose a vehicle photo.'
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      await handleSelectedPhoto(result.assets[0]);
    } catch (error) {
      console.error('Vehicle photo selection error:', error);

      showError(
        'Unable to process the selected vehicle photo. Please try again.'
      );
    }
  };

  const takeVehiclePhoto = async () => {
    try {
      const hasPermission = await requestCameraPermission();

      if (!hasPermission) {
        return;
      }

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      await handleSelectedPhoto(result.assets[0]);
    } catch (error) {
      console.error('Vehicle camera error:', error);

      showError(
        'Unable to process the vehicle photo. Please try again.'
      );
    }
  };

  const validate = (): string | null => {
    if (!name.trim()) {
      return 'Please enter your full name.';
    }

    if (!fatherName.trim()) {
      return 'Please enter your father name.';
    }

    if (!mobileNumber.trim()) {
      return 'Please enter your mobile number.';
    }

    if (!fatherMobileNumber.trim()) {
      return 'Please enter your father mobile number.';
    }

    if (!email.trim()) {
      return 'Please enter your email.';
    }

    if (!cnic.trim()) {
      return 'Please enter your CNIC.';
    }

    if (!vehicleNumber.trim()) {
      return 'Please enter your vehicle number.';
    }

    if (!vehiclePhoto) {
      return 'Please choose or take a photo of your vehicle.';
    }

    if (isUploadingPhoto) {
      return 'Please wait for the vehicle photo to finish uploading.';
    }

    if (!drivingLicenseNumber.trim()) {
      return 'Please enter your driving license number.';
    }

    if (!city.trim()) {
      return 'Please enter your city.';
    }

    if (!area.trim()) {
      return 'Please enter your area.';
    }

    if (!completeAddress.trim()) {
      return 'Please enter your complete address.';
    }

    if (!emergencyContact.trim()) {
      return 'Please enter an emergency contact.';
    }

    const hours = Number(dailyWorkingHours);

    if (
      !dailyWorkingHours.trim() ||
      Number.isNaN(hours) ||
      hours < 1 ||
      hours > 24
    ) {
      return 'Daily working hours must be between 1 and 24.';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();

    if (validationError) {
      showError(validationError);
      return;
    }

    try {
      const data: RiderRegisterData = {
        name: name.trim(),
        fatherName: fatherName.trim(),
        mobileNumber: mobileNumber.trim(),
        fatherMobileNumber: fatherMobileNumber.trim(),
        email: email.trim().toLowerCase(),
        cnic: cnic.trim(),
        vehicleType,
        vehicleNumber: vehicleNumber.trim(),
        vehiclePhoto,
        drivingLicenseNumber: drivingLicenseNumber.trim(),
        city: city.trim(),
        area: area.trim(),
        completeAddress: completeAddress.trim(),
        emergencyContact: emergencyContact.trim(),
        dailyWorkingHours: Number(dailyWorkingHours),
        password,
      };

      const user = await registerRider(data);

      Toast.show({
        type: 'success',
        text1: 'Application Submitted',
        text2:
          'Your rider application is waiting for admin approval.',
      });

      if (
        user.role === 'RIDER' &&
        user.status === 'PENDING'
      ) {
        router.replace('/rider-pending');
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Unable to submit your rider application. Please try again.';

      showError(message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.headerText}>
            <View style={styles.headerBadge}>
              <Ionicons
                name="bicycle-outline"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.eyebrow}>
                DELIVERY PARTNER
              </Text>
            </View>

            <Text style={styles.title}>
              Become a Rider
            </Text>

            <Text style={styles.subtitle}>
              Your next opportunity starts here. Complete your
              details to apply.
            </Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={23}
              color={colors.secondary}
            />
          </View>

          <View style={styles.progressText}>
            <Text style={styles.progressTitle}>
              Rider application
            </Text>
            <Text style={styles.progressDescription}>
              Complete all required fields for admin review.
            </Text>
          </View>

          <View style={styles.secureIcon}>
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading
            number="01"
            title="Personal Information"
            subtitle="Your identity and contact details"
            icon="person-outline"
          />

          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            icon="person-outline"
          />

          <Input
            label="Father Name"
            placeholder="Enter your father name"
            value={fatherName}
            onChangeText={setFatherName}
            icon="people-outline"
          />

          <Input
            label="Mobile Number"
            placeholder="03XX XXXXXXX"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            icon="call-outline"
          />

          <Input
            label="Father Mobile Number"
            placeholder="03XX XXXXXXX"
            value={fatherMobileNumber}
            onChangeText={setFatherMobileNumber}
            keyboardType="phone-pad"
            icon="call-outline"
          />

          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
          />

          <Input
            label="CNIC"
            placeholder="XXXXX-XXXXXXX-X"
            value={cnic}
            onChangeText={setCnic}
            keyboardType="number-pad"
            icon="card-outline"
          />
        </View>

        <View style={styles.section}>
          <SectionHeading
            number="02"
            title="Vehicle Information"
            subtitle="Tell us what you will deliver with"
            icon="bicycle-outline"
          />

          <Text style={styles.label}>Vehicle Type</Text>

          <View style={styles.vehicleRow}>
            <Pressable
              style={({ pressed }) => [
                styles.vehicleOption,
                vehicleType === 'BIKE' &&
                  styles.vehicleOptionActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setVehicleType('BIKE')}
              accessibilityRole="button"
              accessibilityState={{
                selected: vehicleType === 'BIKE',
              }}
            >
              <View
                style={[
                  styles.vehicleIcon,
                  vehicleType === 'BIKE' &&
                    styles.vehicleIconActive,
                ]}
              >
                <Ionicons
                  name="bicycle-outline"
                  size={24}
                  color={
                    vehicleType === 'BIKE'
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
              </View>

              <View style={styles.vehicleTextWrap}>
                <Text
                  style={[
                    styles.vehicleOptionText,
                    vehicleType === 'BIKE' &&
                      styles.vehicleOptionTextActive,
                  ]}
                >
                  Motorbike
                </Text>
                <Text style={styles.vehicleDescription}>
                  Powered vehicle
                </Text>
              </View>

              <Ionicons
                name={
                  vehicleType === 'BIKE'
                    ? 'checkmark-circle'
                    : 'ellipse-outline'
                }
                size={20}
                color={
                  vehicleType === 'BIKE'
                    ? colors.primary
                    : colors.textLight
                }
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.vehicleOption,
                vehicleType === 'CYCLE' &&
                  styles.vehicleOptionActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setVehicleType('CYCLE')}
              accessibilityRole="button"
              accessibilityState={{
                selected: vehicleType === 'CYCLE',
              }}
            >
              <View
                style={[
                  styles.vehicleIcon,
                  vehicleType === 'CYCLE' &&
                    styles.vehicleIconActive,
                ]}
              >
                <Ionicons
                  name="bicycle-outline"
                  size={24}
                  color={
                    vehicleType === 'CYCLE'
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
              </View>

              <View style={styles.vehicleTextWrap}>
                <Text
                  style={[
                    styles.vehicleOptionText,
                    vehicleType === 'CYCLE' &&
                      styles.vehicleOptionTextActive,
                  ]}
                >
                  Bicycle
                </Text>
                <Text style={styles.vehicleDescription}>
                  Non-motorized
                </Text>
              </View>

              <Ionicons
                name={
                  vehicleType === 'CYCLE'
                    ? 'checkmark-circle'
                    : 'ellipse-outline'
                }
                size={20}
                color={
                  vehicleType === 'CYCLE'
                    ? colors.primary
                    : colors.textLight
                }
              />
            </Pressable>
          </View>

          <Input
            label="Vehicle Number"
            placeholder="e.g. ABC-123"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            autoCapitalize="characters"
            icon="pricetag-outline"
          />

          <Text style={styles.label}>Vehicle Photo</Text>

          <View style={styles.photoBox}>
            {vehiclePhotoPreview ? (
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: vehiclePhotoPreview }}
                  style={styles.vehicleImage}
                  resizeMode="cover"
                />

                <View style={styles.photoOverlayTop}>
                  <View style={styles.photoPreviewBadge}>
                    <Ionicons
                      name="image-outline"
                      size={13}
                      color={colors.text}
                    />
                    <Text style={styles.photoPreviewBadgeText}>
                      VEHICLE PREVIEW
                    </Text>
                  </View>
                </View>

                {isUploadingPhoto && (
                  <View style={styles.uploadOverlay}>
                    <ActivityIndicator
                      size="large"
                      color={colors.primary}
                    />
                    <Text style={styles.uploadOverlayText}>
                      Uploading photo...
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <View style={styles.photoPlaceholderIcon}>
                  <Ionicons
                    name="camera-outline"
                    size={30}
                    color={colors.primary}
                  />
                </View>

                <Text style={styles.photoTitle}>
                  Add your vehicle photo
                </Text>

                <Text style={styles.photoDescription}>
                  Use a clear photo that shows your vehicle.
                </Text>

                <Text style={styles.photoHint}>
                  JPG, PNG or supported image format
                </Text>
              </View>
            )}
          </View>

          <View style={styles.photoActions}>
            <Pressable
              style={({ pressed }) => [
                styles.photoButton,
                isUploadingPhoto && styles.disabled,
                pressed && !isUploadingPhoto && styles.pressed,
              ]}
              onPress={chooseVehiclePhoto}
              disabled={isUploadingPhoto}
            >
              <Ionicons
                name="images-outline"
                size={19}
                color={colors.text}
              />
              <Text style={styles.photoButtonText}>
                Choose Photo
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.photoButton,
                isUploadingPhoto && styles.disabled,
                pressed && !isUploadingPhoto && styles.pressed,
              ]}
              onPress={takeVehiclePhoto}
              disabled={isUploadingPhoto}
            >
              <Ionicons
                name="camera-outline"
                size={19}
                color={colors.text}
              />
              <Text style={styles.photoButtonText}>
                Take Photo
              </Text>
            </Pressable>
          </View>

          <Input
            label="Driving License Number"
            placeholder="Enter license number"
            value={drivingLicenseNumber}
            onChangeText={setDrivingLicenseNumber}
            icon="card-outline"
          />
        </View>

        <View style={styles.section}>
          <SectionHeading
            number="03"
            title="Address Information"
            subtitle="Where you live and provide deliveries"
            icon="location-outline"
          />

          <Input
            label="City"
            placeholder="Enter city"
            value={city}
            onChangeText={setCity}
            icon="business-outline"
          />

          <Input
            label="Area"
            placeholder="Enter area"
            value={area}
            onChangeText={setArea}
            icon="map-outline"
          />

          <Input
            label="Complete Address"
            placeholder="House, street, landmark..."
            value={completeAddress}
            onChangeText={setCompleteAddress}
            multiline
            icon="navigate-outline"
          />

          <Input
            label="Emergency Contact"
            placeholder="03XX XXXXXXX"
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            keyboardType="phone-pad"
            icon="call-outline"
          />
        </View>

        <View style={styles.section}>
          <SectionHeading
            number="04"
            title="Work & Account"
            subtitle="Set your availability and secure your account"
            icon="time-outline"
          />

          <Input
            label="Daily Working Hours"
            placeholder="e.g. 8"
            value={dailyWorkingHours}
            onChangeText={setDailyWorkingHours}
            keyboardType="numeric"
            icon="time-outline"
          />

          <PasswordInput
            label="Password"
            placeholder="Minimum 8 characters"
            value={password}
            onChangeText={setPassword}
            visible={showPassword}
            onToggle={() =>
              setShowPassword((current) => !current)
            }
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            visible={showConfirmPassword}
            onToggle={() =>
              setShowConfirmPassword((current) => !current)
            }
          />
        </View>

        <View style={styles.notice}>
          <View style={styles.noticeIconWrap}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={colors.secondary}
            />
          </View>

          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>
              What happens next?
            </Text>
            <Text style={styles.noticeText}>
              Your rider account will remain pending until an
              administrator reviews and approves your application.
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            (isLoading || isUploadingPhoto) &&
              styles.submitButtonDisabled,
            pressed &&
              !isLoading &&
              !isUploadingPhoto &&
              styles.pressed,
          ]}
          onPress={handleRegister}
          disabled={isLoading || isUploadingPhoto}
        >
          {isLoading || isUploadingPhoto ? (
            <ActivityIndicator color={colors.black} />
          ) : (
            <>
              <Text style={styles.submitButtonText}>
                Submit Rider Application
              </Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={colors.black}
              />
            </>
          )}
        </Pressable>

        <Pressable
          style={styles.loginLink}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.loginLinkText}>
            Already have an account?{' '}
            <Text style={styles.loginLinkHighlight}>
              Sign In
            </Text>
          </Text>
        </Pressable>

        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={14}
            color={colors.textLight}
          />
          <Text style={styles.footerText}>
            FoodDash Rider Registration
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type SectionHeadingProps = {
  number: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

function SectionHeading({
  number,
  title,
  subtitle,
  icon,
}: SectionHeadingProps) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionHeadingTop}>
        <View style={styles.sectionIcon}>
          <Ionicons
            name={icon}
            size={20}
            color={colors.primary}
          />
        </View>

        <View style={styles.sectionHeadingText}>
          <Text style={styles.sectionNumber}>
            SECTION {number}
          </Text>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.sectionDivider} />
    </View>
  );
}

type InputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: any;
  secureTextEntry?: boolean;
  multiline?: boolean;
  autoCapitalize?: any;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

function Input({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  secureTextEntry,
  multiline,
  autoCapitalize,
  icon,
}: InputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputWrapper,
          multiline && styles.multilineWrapper,
        ]}
      >
        {icon && (
          <View
            style={[
              styles.inputIcon,
              multiline && styles.multilineIcon,
            ]}
          >
            <Ionicons
              name={icon}
              size={18}
              color={colors.textLight}
            />
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          autoCapitalize={autoCapitalize}
        />
      </View>
    </View>
  );
}

type PasswordInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
};

function PasswordInput({
  label,
  placeholder,
  value,
  onChangeText,
  visible,
  onToggle,
}: PasswordInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.passwordWrapper}>
        <View style={styles.inputIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={18}
            color={colors.textLight}
          />
        </View>

        <TextInput
          style={styles.passwordInput}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable
          onPress={onToggle}
          style={styles.eyeButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            visible ? 'Hide password' : 'Show password'
          }
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 44,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
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
    marginRight: spacing.md,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: spacing.sm,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  title: {
    color: colors.text,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: spacing.xs,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },

  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  progressIcon: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  progressText: {
    flex: 1,
    minWidth: 0,
  },

  progressTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },

  progressDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  secureIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
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
    marginBottom: spacing.lg,
  },

  sectionHeadingTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  sectionHeadingText: {
    flex: 1,
    minWidth: 0,
  },

  sectionNumber: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.lg,
  },

  inputGroup: {
    marginBottom: spacing.md,
  },

  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },

  inputWrapper: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },

  inputIcon: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
    paddingRight: spacing.md,
  },

  multilineWrapper: {
    alignItems: 'flex-start',
    minHeight: 112,
  },

  multilineIcon: {
    paddingTop: spacing.md,
  },

  multilineInput: {
    minHeight: 108,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    lineHeight: 20,
  },

  passwordWrapper: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },

  passwordInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },

  eyeButton: {
    width: 46,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vehicleRow: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  vehicleOption: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },

  vehicleOptionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 107, 26, 0.08)',
  },

  vehicleIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  vehicleIconActive: {
    backgroundColor: 'rgba(255, 107, 26, 0.13)',
  },

  vehicleTextWrap: {
    flex: 1,
  },

  vehicleOptionText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '900',
  },

  vehicleOptionTextActive: {
    color: colors.text,
  },

  vehicleDescription: {
    color: colors.textLight,
    fontSize: 11,
    marginTop: 4,
  },

  photoBox: {
    height: 205,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },

  imageWrapper: {
    flex: 1,
  },

  vehicleImage: {
    width: '100%',
    height: '100%',
  },

  photoOverlayTop: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    alignItems: 'flex-start',
  },

  photoPreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 13, 15, 0.8)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },

  photoPreviewBadgeText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 13, 15, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  uploadOverlayText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: spacing.md,
  },

  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },

  photoPlaceholderIcon: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  photoTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },

  photoDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },

  photoHint: {
    color: colors.textLight,
    fontSize: 10,
    marginTop: spacing.sm,
  },

  photoActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  photoButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },

  photoButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },

  notice: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  noticeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  noticeContent: {
    flex: 1,
  },

  noticeTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },

  noticeText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },

  submitButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitButtonText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900',
  },

  loginLink: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  loginLinkText: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  loginLinkHighlight: {
    color: colors.primary,
    fontWeight: '900',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },

  footerText: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '600',
  },

  disabled: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.75,
  },
});
