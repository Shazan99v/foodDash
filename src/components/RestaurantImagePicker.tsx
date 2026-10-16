import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

import { uploadRestaurantImage } from '../services/restaurantImageUpload';
import { colors, radius, spacing } from '@/constants/theme';

interface RestaurantImagePickerProps {
  label: string;
  imageUrl?: string;
  onChange: (imageUrl: string) => void;
  description?: string;
}

export default function RestaurantImagePicker({
  label,
  imageUrl,
  onChange,
  description,
}: RestaurantImagePickerProps) {
  const [uploading, setUploading] = useState(false);
  const { width } = useWindowDimensions();
  const isCompact = width < 420;

  const handleSelectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      setUploading(true);

      let browserFile: Blob | undefined;

      // Web uploads require a real browser Blob.
      if (Platform.OS === 'web') {
        if (asset.file instanceof Blob) {
          browserFile = asset.file;
        } else {
          const fileResponse = await fetch(asset.uri);

          if (!fileResponse.ok) {
            throw new Error(
              'Could not read the selected image. Please choose it again.',
            );
          }

          browserFile = await fileResponse.blob();
        }

        if (!browserFile.size) {
          throw new Error(
            'The selected image is empty. Please choose another.',
          );
        }
      }

      const extension =
        asset.mimeType === 'image/png'
          ? 'png'
          : asset.mimeType === 'image/webp'
            ? 'webp'
            : 'jpg';

      const uploadedUrl = await uploadRestaurantImage({
        uri: asset.uri,
        fileName: asset.fileName || `restaurant-image.${extension}`,
        mimeType: asset.mimeType,
        file: browserFile,
      });

      onChange(uploadedUrl);

      Toast.show({
        type: 'success',
        text1: 'Picture uploaded',
        text2: 'Your restaurant picture has been uploaded successfully.',
      });
    } catch (error: any) {
      console.error(
        '[RestaurantImagePicker] Upload failed:',
        error?.response?.status,
        error?.response?.data || error,
      );

      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Could not upload the picture. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View style={styles.headingIcon}>
          <Ionicons
            name="images-outline"
            size={19}
            color={colors.secondary}
          />
        </View>

        <View style={styles.headingText}>
          <Text style={styles.label}>{label}</Text>

          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select or change ${label}`}
        accessibilityState={{ disabled: uploading, busy: uploading }}
        onPress={handleSelectImage}
        disabled={uploading}
        style={({ pressed }) => [
          styles.uploadArea,
          pressed && !uploading && styles.pressed,
        ]}
      >
        <View style={styles.previewContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.preview}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.placeholderIcon}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={30}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.placeholderTitle}>Add a picture</Text>

              <Text style={styles.placeholderDescription}>
                JPG, PNG or WEBP
              </Text>

              <Text style={styles.fileLimit}>Maximum 5 MB</Text>
            </View>
          )}

          {imageUrl ? (
            <View style={styles.imageBadge}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.secondary}
              />
              <Text style={styles.imageBadgeText}>Image selected</Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.action,
            isCompact && styles.compactAction,
            uploading && styles.actionUploading,
          ]}
        >
          {uploading ? (
            <>
              <ActivityIndicator color={colors.background} size="small" />
              <Text style={styles.actionText}>Uploading picture...</Text>
            </>
          ) : (
            <>
              <View style={styles.actionIcon}>
                <Ionicons
                  name={imageUrl ? 'camera-outline' : 'add-outline'}
                  size={20}
                  color={colors.background}
                />
              </View>

              <Text style={styles.actionText}>
                {imageUrl ? 'Change picture' : 'Choose picture'}
              </Text>

              <Ionicons
                name="arrow-forward"
                size={17}
                color={colors.background}
              />
            </>
          )}
        </View>
      </Pressable>

      <View style={styles.helperRow}>
        <Ionicons
          name="shield-checkmark-outline"
          size={14}
          color={colors.textLight}
        />
        <Text style={styles.helperText}>
          Use a clear, high-quality image of your restaurant or food.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.xl,
  },

  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  headingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C6F54A18',
    borderWidth: 1,
    borderColor: '#C6F54A35',
  },

  headingText: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },

  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 5,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  uploadArea: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  pressed: {
    opacity: 0.82,
  },

  previewContainer: {
    width: '100%',
    minHeight: 170,
    backgroundColor: colors.primaryDark,
  },

  preview: {
    width: '100%',
    height: 210,
    backgroundColor: colors.surfaceAlt,
  },

  placeholder: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },

  placeholderIcon: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: '#FF6B1A18',
    borderWidth: 1,
    borderColor: '#FF6B1A45',
  },

  placeholderTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.md,
  },

  placeholderDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.sm,
  },

  fileLimit: {
    color: colors.textLight,
    fontSize: 11,
    marginTop: spacing.xs,
  },

  imageBadge: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  imageBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },

  action: {
    minHeight: 52,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },

  compactAction: {
    minHeight: 48,
  },

  actionUploading: {
    backgroundColor: colors.secondary,
    opacity: 0.85,
  },

  actionIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: '#0B0D0F15',
  },

  actionText: {
    flex: 1,
    color: colors.background,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  helperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  helperText: {
    flex: 1,
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 16,
  },
});