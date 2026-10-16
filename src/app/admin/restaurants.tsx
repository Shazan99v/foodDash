import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import {
  AdminRestaurant,
  deleteRestaurant,
  getAllRestaurants,
} from '../../services/admin/adminApi';

import { colors, radius, spacing } from '../../constants/theme';

const API_ROOT = 'http://localhost:5000';

const getImageUrl = (image?: string) => {
  if (!image) return undefined;

  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }

  return `${API_ROOT}${image.startsWith('/') ? '' : '/'}${image}`;
};

export default function AdminRestaurantsScreen() {
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadRestaurants = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError('');

      const data = await getAllRestaurants();

      setRestaurants(
        Array.isArray(data.restaurants) ? data.restaurants : []
      );
    } catch (err: any) {
      console.error('Failed to load restaurants:', err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load restaurants.';

      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRestaurants();
    }, [])
  );

  const handleDelete = async (restaurant: AdminRestaurant) => {
    if (deletingId) return;

    const confirmed = window.confirm(
      `Delete "${restaurant.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(restaurant._id);

      await deleteRestaurant(restaurant._id);

      setRestaurants((current) =>
        current.filter((item) => item._id !== restaurant._id)
      );

      Toast.show({
        type: 'success',
        text1: 'Restaurant deleted',
        text2: `${restaurant.name} has been removed.`,
      });
    } catch (err: any) {
      console.error('Failed to delete restaurant:', err);

      Toast.show({
        type: 'error',
        text1: 'Delete failed',
        text2:
          err?.response?.data?.message ||
          err?.message ||
          'Unable to delete restaurant.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const renderRestaurant = (restaurant: AdminRestaurant) => {
    const imageUrl = getImageUrl(restaurant.logo || restaurant.banner);

    const owner =
      typeof restaurant.owner === 'object'
        ? restaurant.owner
        : null;

    const cuisineText =
      restaurant.cuisineCategories &&
      restaurant.cuisineCategories.length > 0
        ? restaurant.cuisineCategories.join(' • ')
        : 'No cuisine categories';

    return (
      <View key={restaurant._id} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.imageWrapper}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.restaurantImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="restaurant-outline"
                  size={30}
                  color={colors.secondary}
                />
              </View>
            )}
          </View>

          <View style={styles.mainInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.restaurantName} numberOfLines={2}>
                {restaurant.name}
              </Text>

              <View
                style={[
                  styles.statusBadge,
                  restaurant.isActive
                    ? styles.activeBadge
                    : styles.inactiveBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: restaurant.isActive
                        ? colors.success
                        : colors.danger,
                    },
                  ]}
                >
                  {restaurant.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Text>
              </View>
            </View>

            <Text style={styles.cuisine} numberOfLines={2}>
              {cuisineText}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={15}
                color={colors.secondary}
              />

              <Text style={styles.locationText} numberOfLines={2}>
                {restaurant.area}, {restaurant.city}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="star" size={15} color={colors.honey} />
            <Text style={styles.statText}>
              {Number(restaurant.rating || 0).toFixed(1)}
            </Text>
          </View>

          <View style={styles.stat}>
            <Ionicons
              name="receipt-outline"
              size={15}
              color={colors.secondary}
            />
            <Text style={styles.statText}>
              {restaurant.totalOrders || 0} orders
            </Text>
          </View>

          <View style={styles.stat}>
            <Ionicons
              name="time-outline"
              size={15}
              color={colors.secondary}
            />
            <Text style={styles.statText}>
              {restaurant.averagePreparationTime || 30} min
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Ionicons
              name={restaurant.isOpen ? 'radio-button-on' : 'radio-button-off'}
              size={15}
              color={restaurant.isOpen ? colors.success : colors.textLight}
            />

            <Text style={styles.infoText}>
              {restaurant.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>

          <Text style={styles.hours}>
            {restaurant.openingTime} - {restaurant.closingTime}
          </Text>
        </View>

        {owner && (
          <View style={styles.ownerBox}>
            <View style={styles.ownerIcon}>
              <Ionicons
                name="person-outline"
                size={16}
                color={colors.secondary}
              />
            </View>

            <View style={styles.ownerInfo}>
              <Text style={styles.ownerLabel}>Business Owner</Text>

              <Text style={styles.ownerName} numberOfLines={1}>
                {owner.name}
              </Text>

              <Text style={styles.ownerEmail} numberOfLines={1}>
                {owner.email}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() =>
              router.push(`/admin/restaurants/${restaurant._id}`)
            }
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={colors.primary}
            />

            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.buttonPressed,
              deletingId === restaurant._id && styles.disabledButton,
            ]}
            onPress={() => handleDelete(restaurant)}
            disabled={deletingId === restaurant._id}
          >
            {deletingId === restaurant._id ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Ionicons
                name="trash-outline"
                size={18}
                color={colors.danger}
              />
            )}

            <Text style={styles.deleteButtonText}>
              {deletingId === restaurant._id ? 'Deleting...' : 'Delete'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.replace('/admin')}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>ADMIN PANEL</Text>
          <Text style={styles.title}>Restaurants</Text>
          <Text style={styles.subtitle}>
            Manage restaurant information
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{restaurants.length}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <View style={styles.stateIcon}>
            <Ionicons
              name="alert-circle-outline"
              size={38}
              color={colors.danger}
            />
          </View>

          <Text style={styles.errorTitle}>
            Unable to load restaurants
          </Text>

          <Text style={styles.errorText}>{error}</Text>

          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => loadRestaurants()}
          >
            <Ionicons
              name="refresh"
              size={18}
              color={colors.black}
            />
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadRestaurants(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.overviewCard}>
            <View style={styles.overviewIcon}>
              <Ionicons
                name="restaurant"
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={styles.overviewInfo}>
              <Text style={styles.overviewTitle}>
                Restaurant directory
              </Text>
              <Text style={styles.overviewDescription}>
                Review restaurant status, performance, location, and owner
                information.
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>TOTAL</Text>
              <Text style={styles.summaryValue}>
                {restaurants.length}
              </Text>
              <Text style={styles.summaryCaption}>Restaurants</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>ACTIVE</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {restaurants.filter((item) => item.isActive).length}
              </Text>
              <Text style={styles.summaryCaption}>Available</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>INACTIVE</Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>
                {restaurants.filter((item) => !item.isActive).length}
              </Text>
              <Text style={styles.summaryCaption}>Unavailable</Text>
            </View>
          </View>

          {restaurants.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="restaurant-outline"
                  size={38}
                  color={colors.secondary}
                />
              </View>

              <Text style={styles.emptyTitle}>No restaurants yet</Text>

              <Text style={styles.emptyText}>
                Approved business applications will create restaurants
                automatically.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>
                  All restaurants
                </Text>
                <Text style={styles.sectionCount}>
                  {restaurants.length} listed
                </Text>
              </View>

              {restaurants.map(renderRestaurant)}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.black,
  },

  backButton: {
    width: 44,
    height: 44,
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
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 3,
  },

  title: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },

  countBadge: {
    minWidth: 40,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: spacing.sm,
  },

  countText: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: '900',
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 26, 0.14)',
    marginRight: spacing.md,
  },

  overviewInfo: {
    flex: 1,
  },

  overviewTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },

  overviewDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },

  summaryCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  summaryLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  summaryValue: {
    color: colors.primary,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 5,
  },

  summaryCaption: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },

  sectionCount: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '700',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  cardTop: {
    flexDirection: 'row',
  },

  imageWrapper: {
    width: 82,
    height: 82,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },

  restaurantImage: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  restaurantName: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    paddingRight: spacing.sm,
  },

  statusBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  activeBadge: {
    backgroundColor: 'rgba(198, 245, 74, 0.12)',
  },

  inactiveBadge: {
    backgroundColor: 'rgba(255, 98, 104, 0.12)',
  },

  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  cuisine: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },

  locationText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 5,
    lineHeight: 17,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  statText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  infoBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 7,
  },

  hours: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 22,
  },

  ownerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },

  ownerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },

  ownerInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },

  ownerLabel: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '800',
  },

  ownerName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },

  ownerEmail: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  editButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    backgroundColor: 'rgba(255, 107, 26, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 26, 0.35)',
  },

  editButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },

  deleteButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    backgroundColor: 'rgba(255, 98, 104, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 98, 104, 0.30)',
  },

  deleteButtonText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '900',
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },

  stateIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontSize: 13,
  },

  errorTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: spacing.md,
    textAlign: 'center',
  },

  errorText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 420,
  },

  retryButton: {
    marginTop: spacing.lg,
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  retryText: {
    color: colors.black,
    fontSize: 13,
    fontWeight: '900',
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingTop: 70,
    paddingBottom: 40,
  },

  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    marginTop: spacing.lg,
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 400,
  },
});
