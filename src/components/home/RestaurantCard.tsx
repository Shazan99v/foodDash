import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';
import { CustomerRestaurant } from '../../services/customer/catalogApi';

type RestaurantCardProps = {
  restaurant: CustomerRestaurant;
};

const API_ORIGIN = 'http://localhost:5000';

function resolveImageUrl(value?: string | null): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const imagePath = value.trim();

  if (!imagePath) {
    return '';
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  return `${API_ORIGIN}/${imagePath.replace(/^\/+/, '')}`;
}

export default function RestaurantCard({
  restaurant,
}: RestaurantCardProps) {
  const { width } = useWindowDimensions();

  const [isFavorite, setIsFavorite] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const isCompact = width < 360;

  const imageUrl = resolveImageUrl(
    restaurant.banner ||
      restaurant.logo ||
      restaurant.images?.[0] ||
      '',
  );

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const handleRestaurantPress = () => {
    router.push({
      pathname: '/restaurant/[id]',
      params: {
        id: restaurant._id,
      },
    });
  };

  const handleFavoritePress = () => {
    setIsFavorite((current) => !current);
  };

  const cuisine = restaurant.cuisineCategories?.length
    ? restaurant.cuisineCategories.join(' • ')
    : 'Restaurant';

  const deliveryTime = restaurant.averagePreparationTime
    ? `${restaurant.averagePreparationTime} min`
    : '30–40 min';

  const deliveryFee =
    restaurant.deliveryFee === undefined ||
    restaurant.deliveryFee === 0
      ? 'Free delivery'
      : `Rs. ${restaurant.deliveryFee}`;

  const rating =
    typeof restaurant.rating === 'number'
      ? restaurant.rating.toFixed(1)
      : 'New';

  return (
    <View style={styles.card}>
      <View style={[styles.imageContainer, isCompact && styles.compactImageContainer]}>
        {imageUrl && !imageFailed ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <View style={styles.placeholderIcon}>
              <Ionicons
                name="restaurant-outline"
                size={34}
                color={colors.secondary}
              />
            </View>

            <Text style={styles.placeholderText} numberOfLines={2}>
              {restaurant.name || 'Restaurant'}
            </Text>

            <Text style={styles.placeholderCaption}>
              GOOD FOOD, GOOD MOOD
            </Text>
          </View>
        )}

        <View pointerEvents="none" style={styles.imageOverlay} />

        <View style={styles.imageTopRow}>
          {restaurant.isFeatured ? (
            <View style={styles.featuredBadge}>
              <Ionicons
                name="flash"
                size={12}
                color={colors.background}
              />

              <Text style={styles.featuredText}>FEATURED</Text>
            </View>
          ) : (
            <View />
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isFavorite
                ? `Remove ${restaurant.name} from favorites`
                : `Add ${restaurant.name} to favorites`
            }
            accessibilityState={{ selected: isFavorite }}
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            hitSlop={8}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={19}
              color={isFavorite ? colors.primary : colors.text}
            />
          </Pressable>
        </View>

        <View pointerEvents="none" style={styles.imageBottomRow}>
          <View style={styles.imageTag}>
            <Ionicons
              name="restaurant-outline"
              size={12}
              color={colors.text}
            />

            <Text style={styles.imageTagText}>FOOD & DRINKS</Text>
          </View>

          <View style={styles.ratingBadge}>
            <Ionicons
              name="star"
              size={12}
              color={colors.secondary}
            />

            <Text style={styles.ratingBadgeText}>{rating}</Text>
          </View>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${restaurant.name} menu`}
        style={({ pressed }) => [
          styles.restaurantContentButton,
          pressed && styles.restaurantContentPressed,
        ]}
        onPress={handleRestaurantPress}
      >
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {restaurant.name}
            </Text>

            {restaurant.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.secondary}
                />
              </View>
            )}
          </View>

          <Text style={styles.cuisine} numberOfLines={1}>
            {cuisine}
          </Text>

          <View style={styles.detailsRow}>
            <View style={styles.detail}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.detailText}>{deliveryTime}</Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.detail}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="bicycle-outline"
                  size={14}
                  color={colors.secondary}
                />
              </View>

              <Text
                style={[
                  styles.deliveryText,
                  isCompact && styles.compactDeliveryText,
                ]}
                numberOfLines={1}
              >
                {deliveryFee}
              </Text>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <View
              style={[
                styles.status,
                restaurant.isOpen
                  ? styles.openStatus
                  : styles.closedStatus,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: restaurant.isOpen
                      ? colors.secondary
                      : colors.textLight,
                  },
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  {
                    color: restaurant.isOpen
                      ? colors.secondary
                      : colors.textSecondary,
                  },
                ]}
              >
                {restaurant.isOpen ? 'Open now' : 'Closed'}
              </Text>
            </View>

            <View style={styles.viewRestaurant}>
              <Text style={styles.viewText}>View menu</Text>

              <View style={styles.arrowContainer}>
                <Ionicons
                  name="arrow-forward"
                  size={13}
                  color={colors.background}
                />
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 5,
  },

  imageContainer: {
    height: 195,
    position: 'relative',
    backgroundColor: colors.surfaceAlt,
  },

  compactImageContainer: {
    height: 170,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },

  placeholderIcon: {
    width: 62,
    height: 62,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  placeholderCaption: {
    marginTop: spacing.xs,
    color: colors.secondary,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,13,15,0.13)',
  },

  imageTopRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.round,
  },

  featuredText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.background,
    letterSpacing: 0.7,
  },

  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: 'rgba(17,19,21,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(245,245,240,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  imageBottomRow: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  imageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(17,19,21,0.86)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: 'rgba(245,245,240,0.12)',
  },

  imageTagText: {
    color: colors.text,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },

  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.text,
  },

  restaurantContentButton: {
    width: '100%',
  },

  restaurantContentPressed: {
    opacity: 0.88,
  },

  content: {
    padding: spacing.lg,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.3,
  },

  verifiedBadge: {
    width: 25,
    height: 25,
    borderRadius: radius.sm,
    backgroundColor: '#C6F54A12',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },

  cuisine: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 5,
  },

  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },

  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
  },

  detailIcon: {
    width: 25,
    height: 25,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },

  detailText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  deliveryText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '800',
    color: colors.secondary,
  },

  compactDeliveryText: {
    fontSize: 9,
  },

  separator: {
    width: 3,
    height: 3,
    borderRadius: radius.round,
    backgroundColor: colors.textLight,
    marginHorizontal: spacing.sm,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  status: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.round,
  },

  openStatus: {
    backgroundColor: '#C6F54A12',
  },

  closedStatus: {
    backgroundColor: colors.surfaceAlt,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: radius.round,
    marginRight: 6,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },

  viewRestaurant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  viewText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.primary,
  },

  arrowContainer: {
    width: 25,
    height: 25,
    borderRadius: radius.round,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
