import React, { useEffect, useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

import {
  AdminRestaurant,
  getRestaurantById,
  updateRestaurant,
} from '../../../services/admin/adminApi';
import { uploadRestaurantImage } from '../../../services/restaurantImageUpload';
import { colors, radius, spacing } from '../../../constants/theme';

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address' | 'decimal-pad';
};

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
}: FieldProps) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textLight}
      multiline={multiline}
      keyboardType={keyboardType}
      style={[styles.input, multiline && styles.multilineInput]}
    />
  </View>
);

type ImageControlProps = {
  label: string;
  description: string;
  imageUrl: string;
  onPick: () => void;
  uploading: boolean;
};

function ImageControl({
  label,
  description,
  imageUrl,
  onPick,
  uploading,
}: ImageControlProps) {
  return (
    <View style={styles.imageControl}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.imageDescription}>{description}</Text>

      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.imagePreview}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <View style={styles.placeholderIcon}>
            <Ionicons
              name="image-outline"
              size={32}
              color={colors.primary}
            />
          </View>
          <Text style={styles.imagePlaceholderText}>
            No picture uploaded
          </Text>
          <Text style={styles.placeholderHint}>
            Upload an image to improve your restaurant page
          </Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.imageButton,
          pressed && styles.pressed,
          uploading && styles.disabled,
        ]}
        onPress={onPick}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <Ionicons
              name={imageUrl ? 'camera-outline' : 'cloud-upload-outline'}
              size={18}
              color={colors.text}
            />
            <Text style={styles.imageButtonText}>
              {imageUrl ? 'Change Picture' : 'Upload Picture'}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

export default function EditRestaurantScreen() {
  const params = useLocalSearchParams<{
    restaurantId?: string;
    resturantId?: string;
  }>();

  const restaurantId = params.restaurantId || params.resturantId;

  const [restaurant, setRestaurant] =
    useState<AdminRestaurant | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisineCategories, setCuisineCategories] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [deliveryAreas, setDeliveryAreas] = useState('');
  const [preparationTime, setPreparationTime] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [deliveryRules, setDeliveryRules] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [payoutDetails, setPayoutDetails] = useState('');

  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadRestaurant();
  }, [restaurantId]);

  const loadRestaurant = async () => {
    if (!restaurantId) {
      setError('Restaurant ID is missing.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const data = await getRestaurantById(restaurantId);
      const item = data.restaurant;

      setRestaurant(item);
      setName(item.name || '');
      setDescription(item.description || '');
      setCuisineCategories(item.cuisineCategories?.join(', ') || '');
      setAddress(item.address || '');
      setCity(item.city || '');
      setArea(item.area || '');
      setLocation(item.location || '');
      setPhone(item.phone || '');
      setSecondaryPhone(item.secondaryPhone || '');
      setOpeningTime(item.openingTime || '');
      setClosingTime(item.closingTime || '');
      setDeliveryAreas(item.deliveryAreas?.join(', ') || '');
      setPreparationTime(String(item.averagePreparationTime ?? 30));
      setDeliveryFee(String(item.deliveryFee ?? 0));
      setDeliveryRules(item.deliveryRules || '');
      setCommissionRate(String(item.commissionRate ?? 0));
      setPayoutDetails(item.payoutDetails || '');
      setLogo(item.logo || '');
      setBanner(item.banner || '');
      setImages(Array.isArray(item.images) ? item.images : []);
    } catch (err: any) {
      console.error('Failed to load restaurant:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load restaurant.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const pickAndUploadImage = async (
    field: 'logo' | 'banner' | 'gallery'
  ) => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Toast.show({
          type: 'error',
          text1: 'Photo access required',
          text2: 'Allow photo library access to select a picture.',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: field === 'banner' ? [16, 9] : [4, 3],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) return;

      setUploadingImage(field);

      const asset = result.assets[0];
      const imageUrl = await uploadRestaurantImage({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });

      if (field === 'logo') {
        setLogo(imageUrl);
      } else if (field === 'banner') {
        setBanner(imageUrl);
      } else {
        setImages((current) => [...current, imageUrl]);
      }

      Toast.show({
        type: 'success',
        text1: 'Picture uploaded',
        text2: 'Remember to save your restaurant changes.',
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2:
          err?.response?.data?.message ||
          err?.message ||
          'Could not upload the picture.',
      });
    } finally {
      setUploadingImage('');
    }
  };

  const removeGalleryImage = (index: number) => {
    setImages((current) => current.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!restaurantId) return;

    if (
      !name.trim() ||
      !address.trim() ||
      !city.trim() ||
      !area.trim() ||
      !location.trim() ||
      !phone.trim() ||
      !openingTime.trim() ||
      !closingTime.trim()
    ) {
      Toast.show({
        type: 'error',
        text1: 'Required information missing',
        text2: 'Complete all required restaurant fields.',
      });
      return;
    }

    const parsedPreparationTime = Number(preparationTime);
    const parsedDeliveryFee = Number(deliveryFee);
    const parsedCommissionRate = Number(commissionRate);

    if (
      !Number.isFinite(parsedPreparationTime) ||
      parsedPreparationTime < 1
    ) {
      Toast.show({
        type: 'error',
        text1: 'Invalid preparation time',
        text2: 'Preparation time must be at least 1 minute.',
      });
      return;
    }

    if (!Number.isFinite(parsedDeliveryFee) || parsedDeliveryFee < 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid delivery fee',
      });
      return;
    }

    if (
      !Number.isFinite(parsedCommissionRate) ||
      parsedCommissionRate < 0 ||
      parsedCommissionRate > 100
    ) {
      Toast.show({
        type: 'error',
        text1: 'Invalid commission rate',
        text2: 'Commission must be between 0 and 100.',
      });
      return;
    }

    try {
      setIsSaving(true);

      await updateRestaurant(restaurantId, {
        name: name.trim(),
        description: description.trim() || undefined,
        cuisineCategories: cuisineCategories
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        address: address.trim(),
        city: city.trim(),
        area: area.trim(),
        location: location.trim(),
        phone: phone.trim(),
        secondaryPhone: secondaryPhone.trim() || undefined,
        openingTime: openingTime.trim(),
        closingTime: closingTime.trim(),
        deliveryAreas: deliveryAreas
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        averagePreparationTime: parsedPreparationTime,
        deliveryFee: parsedDeliveryFee,
        deliveryRules: deliveryRules.trim() || undefined,
        commissionRate: parsedCommissionRate,
        payoutDetails: payoutDetails.trim() || undefined,
        logo,
        banner,
        images,
      });

      Toast.show({
        type: 'success',
        text1: 'Restaurant updated',
        text2: 'Restaurant details and pictures were saved.',
      });

      router.replace('/admin/restaurants');
    } catch (err: any) {
      console.error('Failed to update restaurant:', err);
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2:
          err?.response?.data?.message ||
          err?.message ||
          'Unable to update restaurant.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading restaurant...</Text>
      </View>
    );
  }

  if (error || !restaurant) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIcon}>
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color={colors.danger}
          />
        </View>
        <Text style={styles.errorTitle}>Unable to load restaurant</Text>
        <Text style={styles.errorText}>
          {error || 'Restaurant not found.'}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.backHomeButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.replace('/admin/restaurants')}
        >
          <Ionicons name="arrow-back" size={17} color={colors.black} />
          <Text style={styles.backHomeText}>Back to Restaurants</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.replace('/admin/restaurants')}
            accessibilityRole="button"
            accessibilityLabel="Back to restaurants"
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>RESTAURANT MANAGEMENT</Text>
            <Text style={styles.title}>Edit Restaurant</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {restaurant.name}
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="create-outline"
              size={21}
              color={colors.primary}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <Ionicons
                name="options-outline"
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={styles.introText}>
              <Text style={styles.introTitle}>Restaurant details</Text>
              <Text style={styles.introDescription}>
                Keep your restaurant information, delivery settings, and
                pictures up to date.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="images-outline"
                  size={19}
                  color={colors.primary}
                />
              </View>
              <View style={styles.sectionHeadingText}>
                <Text style={styles.sectionTitle}>Restaurant Pictures</Text>
                <Text style={styles.sectionSubtitle}>
                  Make a strong first impression
                </Text>
              </View>
            </View>

            <ImageControl
              label="Restaurant Logo"
              description="Logo shown alongside your restaurant details."
              imageUrl={logo}
              onPick={() => void pickAndUploadImage('logo')}
              uploading={uploadingImage === 'logo'}
            />

            <ImageControl
              label="Restaurant Banner"
              description="Wide cover image displayed at the top of the restaurant page."
              imageUrl={banner}
              onPick={() => void pickAndUploadImage('banner')}
              uploading={uploadingImage === 'banner'}
            />

            <View style={styles.galleryHeader}>
              <View>
                <Text style={styles.label}>Gallery Pictures</Text>
                <Text style={styles.galleryDescription}>
                  Additional photos of your food or restaurant
                </Text>
              </View>
              <View style={styles.galleryCountBadge}>
                <Text style={styles.galleryCount}>{images.length}</Text>
              </View>
            </View>

            {images.length > 0 ? (
              <View style={styles.gallery}>
                {images.map((imageUrl, index) => (
                  <View
                    key={`${imageUrl}-${index}`}
                    style={styles.galleryItem}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.galleryImage}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Remove gallery picture"
                      style={styles.removeImageButton}
                      onPress={() => removeGalleryImage(index)}
                    >
                      <Ionicons
                        name="close"
                        size={17}
                        color={colors.text}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyGallery}>
                <Ionicons
                  name="images-outline"
                  size={23}
                  color={colors.textLight}
                />
                <Text style={styles.emptyGalleryText}>
                  No gallery pictures uploaded yet.
                </Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.imageButton,
                pressed && styles.pressed,
                uploadingImage === 'gallery' && styles.disabled,
              ]}
              onPress={() => void pickAndUploadImage('gallery')}
              disabled={!!uploadingImage}
            >
              {uploadingImage === 'gallery' ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <>
                  <Ionicons
                    name="add-circle-outline"
                    size={19}
                    color={colors.text}
                  />
                  <Text style={styles.imageButtonText}>
                    Add Gallery Picture
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.section}>
            <SectionHeader
              icon="restaurant-outline"
              title="Basic Information"
              subtitle="Name, description, and cuisine"
            />
            <Field
              label="Restaurant Name *"
              value={name}
              onChangeText={setName}
              placeholder="Restaurant name"
            />
            <Field
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the restaurant"
              multiline
            />
            <Field
              label="Cuisine Categories"
              value={cuisineCategories}
              onChangeText={setCuisineCategories}
              placeholder="Pakistani, BBQ, Fast Food"
            />
          </View>

          <View style={styles.section}>
            <SectionHeader
              icon="location-outline"
              title="Location"
              subtitle="Where customers can find you"
            />
            <Field
              label="Address *"
              value={address}
              onChangeText={setAddress}
              placeholder="Full address"
              multiline
            />
            <Field
              label="City *"
              value={city}
              onChangeText={setCity}
              placeholder="City"
            />
            <Field
              label="Area *"
              value={area}
              onChangeText={setArea}
              placeholder="Area / neighborhood"
            />
            <Field
              label="Location *"
              value={location}
              onChangeText={setLocation}
              placeholder="Location description"
            />
          </View>

          <View style={styles.section}>
            <SectionHeader
              icon="call-outline"
              title="Contact"
              subtitle="Customer contact numbers"
            />
            <Field
              label="Phone *"
              value={phone}
              onChangeText={setPhone}
              placeholder="03XX XXXXXXX"
              keyboardType="phone-pad"
            />
            <Field
              label="Secondary Phone"
              value={secondaryPhone}
              onChangeText={setSecondaryPhone}
              placeholder="Optional phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.section}>
            <SectionHeader
              icon="time-outline"
              title="Operating Hours"
              subtitle="When your restaurant is available"
            />
            <View style={styles.row}>
              <View style={styles.half}>
                <Field
                  label="Opening Time *"
                  value={openingTime}
                  onChangeText={setOpeningTime}
                  placeholder="09:00 AM"
                />
              </View>
              <View style={styles.half}>
                <Field
                  label="Closing Time *"
                  value={closingTime}
                  onChangeText={setClosingTime}
                  placeholder="11:00 PM"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              icon="bicycle-outline"
              title="Delivery"
              subtitle="Fees, delivery areas, and timing"
            />
            <Field
              label="Delivery Areas"
              value={deliveryAreas}
              onChangeText={setDeliveryAreas}
              placeholder="Gulgasht, Cantt, Bosan Road"
            />
            <Field
              label="Preparation Time (minutes)"
              value={preparationTime}
              onChangeText={setPreparationTime}
              placeholder="30"
              keyboardType="numeric"
            />
            <Field
              label="Delivery Fee"
              value={deliveryFee}
              onChangeText={setDeliveryFee}
              placeholder="0"
              keyboardType="decimal-pad"
            />
            <Field
              label="Delivery Rules"
              value={deliveryRules}
              onChangeText={setDeliveryRules}
              placeholder="Free delivery above Rs. 1000"
              multiline
            />
          </View>

          <View style={styles.section}>
            <SectionHeader
              icon="settings-outline"
              title="Business Settings"
              subtitle="Commission and payout details"
            />
            <Field
              label="Commission Rate (%)"
              value={commissionRate}
              onChangeText={setCommissionRate}
              placeholder="0"
              keyboardType="decimal-pad"
            />
            <Field
              label="Payout Details"
              value={payoutDetails}
              onChangeText={setPayoutDetails}
              placeholder="Bank / wallet payout information"
              multiline
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              isSaving && styles.disabled,
              pressed && !isSaving && styles.pressed,
            ]}
            onPress={() => void handleSave()}
            disabled={isSaving || !!uploadingImage}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color={colors.black}
              />
            )}
            <Text style={styles.saveText}>
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </Text>
          </Pressable>

          {uploadingImage ? (
            <Text style={styles.uploadNotice}>
              <Ionicons name="cloud-upload-outline" size={13} />
              {' '}Wait for the picture upload to finish before saving.
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={19} color={colors.primary} />
      </View>
      <View style={styles.sectionHeadingText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboard: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 44,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  introIcon: {
    width: 45,
    height: 45,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: {
    flex: 1,
  },
  introTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  introDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeadingText: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: colors.textLight,
    fontSize: 11,
    marginTop: 3,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 47,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 86,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
    minWidth: 0,
  },
  imageControl: {
    marginBottom: spacing.xl,
  },
  imageDescription: {
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  imagePreview: {
    width: '100%',
    height: 185,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  imagePlaceholder: {
    minHeight: 150,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  placeholderIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  imagePlaceholderText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  placeholderHint: {
    color: colors.textLight,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 5,
  },
  imageButton: {
    minHeight: 45,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  imageButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  galleryDescription: {
    color: colors.textLight,
    fontSize: 11,
    marginTop: 4,
  },
  galleryCountBadge: {
    minWidth: 32,
    height: 30,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryCount: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '900',
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  galleryItem: {
    width: '48%',
    flexGrow: 1,
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 29,
    height: 29,
    borderRadius: radius.round,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGallery: {
    minHeight: 78,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  emptyGalleryText: {
    color: colors.textLight,
    fontSize: 12,
  },
  saveButton: {
    minHeight: 53,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  saveText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900',
  },
  uploadNotice: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.55,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontSize: 13,
  },
  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  backHomeButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    minHeight: 45,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  backHomeText: {
    color: colors.black,
    fontSize: 13,
    fontWeight: '900',
  },
});
