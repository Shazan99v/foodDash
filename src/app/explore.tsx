import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, spacing, radius } from '../constants/theme';
import api from '../services/api';
import BottomNavigation from '../components/navigation/BottomNavigation';

type Restaurant = {
  _id: string;
  name: string;
  description?: string;
  cuisine?: string | string[];
  city?: string;
  area?: string;
  address?: string;
  logo?: string;
  banner?: string;
  images?: string[];
  isOpen?: boolean;
  isActive?: boolean;
  rating?: number;
  deliveryTime?: string;
  deliveryFee?: number;
};

const cuisineOptions = [
  { label: 'All', icon: 'grid-outline' },
  { label: 'Burgers', icon: 'fast-food-outline' },
  { label: 'Pizza', icon: 'pizza-outline' },
  { label: 'Chicken', icon: 'flame-outline' },
  { label: 'BBQ', icon: 'bonfire-outline' },
  { label: 'Asian', icon: 'restaurant-outline' },
  { label: 'Desserts', icon: 'ice-cream-outline' },
];

export default function ExploreScreen() {
  const router = useRouter();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadRestaurants = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const response = await api.get('/catalog/restaurants');
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.restaurants)
          ? data.restaurants
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setRestaurants(list);
    } catch (err: any) {
      console.error(
        'Explore restaurants error:',
        err?.response?.data || err?.message || err
      );

      setError(
        err?.response?.data?.message ||
          'Could not load restaurants. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const filteredRestaurants = useMemo(() => {
    const query = search.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const cuisineText = Array.isArray(restaurant.cuisine)
        ? restaurant.cuisine.join(' ')
        : restaurant.cuisine || '';

      const searchableText = [
        restaurant.name,
        restaurant.description,
        cuisineText,
        restaurant.city,
        restaurant.area,
        restaurant.address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const normalizedCuisine = selectedCuisine.toLowerCase();
      const normalizedCuisineText = cuisineText.toLowerCase();
      const normalizedName = restaurant.name.toLowerCase();

      const matchesCuisine =
        selectedCuisine === 'All' ||
        (normalizedCuisine === 'chicken' &&
          /chicken|fried chicken|broast/.test(normalizedCuisineText)) ||
        (normalizedCuisine === 'bbq' &&
          /bbq|barbecue|grill/.test(normalizedCuisineText)) ||
        normalizedCuisineText.includes(normalizedCuisine) ||
        normalizedName.includes(normalizedCuisine);

      return matchesSearch && matchesCuisine;
    });
  }, [restaurants, search, selectedCuisine]);

  const openRestaurant = (restaurant: Restaurant) => {
    router.push({
      pathname: '/restaurant/[id]',
      params: { id: restaurant._id },
    });
  };

  const renderRestaurant = (restaurant: Restaurant) => {
    const imageUri =
      restaurant.banner ||
      restaurant.logo ||
      restaurant.images?.[0];

    const location = [restaurant.area, restaurant.city]
      .filter(Boolean)
      .join(', ');

    const cuisineText = Array.isArray(restaurant.cuisine)
      ? restaurant.cuisine.join(' · ')
      : restaurant.cuisine || 'Restaurant';

    return (
      <Pressable
        key={restaurant._id}
        style={({ pressed }) => [
          styles.restaurantCard,
          pressed && styles.cardPressed,
        ]}
        onPress={() => openRestaurant(restaurant)}
        accessibilityRole="button"
        accessibilityLabel={`View ${restaurant.name}`}
      >
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.restaurantImage}
              resizeMode="cover"
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
              <Text style={styles.placeholderText}>
                FoodDash
              </Text>
            </View>
          )}

          <View style={styles.imageShade} />

          <View style={styles.imageBadge}>
            <Ionicons
              name="star"
              size={13}
              color={colors.secondary}
            />
            <Text style={styles.ratingText}>
              {typeof restaurant.rating === 'number'
                ? restaurant.rating.toFixed(1)
                : 'New'}
            </Text>
          </View>

          {restaurant.isOpen === false && (
            <View style={styles.closedBadge}>
              <View style={styles.closedDot} />
              <Text style={styles.closedText}>Closed</Text>
            </View>
          )}

          {restaurant.deliveryTime && (
            <View style={styles.deliveryBadge}>
              <Ionicons
                name="time-outline"
                size={13}
                color={colors.text}
              />
              <Text style={styles.deliveryText}>
                {restaurant.deliveryTime}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.restaurantInfo}>
          <View style={styles.restaurantTitleRow}>
            <Text style={styles.restaurantName} numberOfLines={1}>
              {restaurant.name}
            </Text>

            <View style={styles.arrowButton}>
              <Ionicons
                name="arrow-up-outline"
                size={17}
                color={colors.text}
              />
            </View>
          </View>

          <Text style={styles.cuisineText} numberOfLines={1}>
            {cuisineText}
          </Text>

          {!!location && (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          )}

          {!!restaurant.description && (
            <Text style={styles.description} numberOfLines={2}>
              {restaurant.description}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.footerDetail}>
              <Ionicons
                name="bicycle-outline"
                size={15}
                color={colors.secondary}
              />
              <Text style={styles.footerText}>
                {typeof restaurant.deliveryFee === 'number'
                  ? restaurant.deliveryFee === 0
                    ? 'Free delivery'
                    : `Delivery Rs. ${restaurant.deliveryFee}`
                  : 'Delivery available'}
              </Text>
            </View>

            <Text style={styles.viewMenuText}>View menu</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRestaurants(true)}
            tintColor={colors.secondary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrow}>
                YOUR NEXT CRAVING STARTS HERE
              </Text>
            </View>

            <Text style={styles.heading}>
              Explore<Text style={styles.headingAccent}>.</Text>
            </Text>

            <Text style={styles.subtitle}>
              Discover good food. Find your favourites.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="compass-outline"
              size={28}
              color={colors.secondary}
            />
            <View style={styles.headerIconDot} />
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchIconContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color={colors.secondary}
            />
          </View>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Restaurants, food, cuisines..."
            placeholderTextColor={colors.textLight}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search restaurants and cuisines"
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={styles.clearSearchButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              What are you craving?
            </Text>
            <Text style={styles.sectionSubtitle}>
              Pick your mood. Find your food.
            </Text>
          </View>

          <View style={styles.sectionAccent}>
            <Ionicons
              name="flash"
              size={18}
              color={colors.background}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cuisineList}
        >
          {cuisineOptions.map((item) => {
            const selected = selectedCuisine === item.label;

            return (
              <Pressable
                key={item.label}
                onPress={() => setSelectedCuisine(item.label)}
                style={[
                  styles.cuisineChip,
                  selected && styles.cuisineChipSelected,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Ionicons
                  name={item.icon as any}
                  size={17}
                  color={
                    selected
                      ? colors.background
                      : colors.textSecondary
                  }
                />

                <Text
                  style={[
                    styles.cuisineChipText,
                    selected && styles.cuisineChipTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.resultsHeader}>
          <View style={styles.resultsHeaderText}>
            <Text style={styles.sectionTitle}>
              Restaurants for you
            </Text>
            <Text style={styles.sectionSubtitle}>
              {loading
                ? 'Finding your next favourite...'
                : `${filteredRestaurants.length} ${
                    filteredRestaurants.length === 1
                      ? 'restaurant'
                      : 'restaurants'
                  } found`}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => loadRestaurants(true)}
            accessibilityRole="button"
            accessibilityLabel="Refresh restaurants"
          >
            <Ionicons
              name="refresh-outline"
              size={19}
              color={colors.secondary}
            />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.stateContainer}>
            <View style={styles.stateIcon}>
              <ActivityIndicator
                size="large"
                color={colors.secondary}
              />
            </View>

            <Text style={styles.stateTitle}>
              Good food is on its way
            </Text>
            <Text style={styles.stateText}>
              Loading restaurants for you...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.stateContainer}>
            <View style={styles.stateIcon}>
              <Ionicons
                name="cloud-offline-outline"
                size={30}
                color={colors.danger}
              />
            </View>

            <Text style={styles.stateTitle}>
              Couldn't load restaurants
            </Text>
            <Text style={styles.stateText}>{error}</Text>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => loadRestaurants()}
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color={colors.background}
              />
              <Text style={styles.actionButtonText}>
                Try again
              </Text>
            </Pressable>
          </View>
        ) : filteredRestaurants.length === 0 ? (
          <View style={styles.stateContainer}>
            <View style={styles.stateIcon}>
              <Ionicons
                name="restaurant-outline"
                size={32}
                color={colors.secondary}
              />
            </View>

            <Text style={styles.stateTitle}>
              {search || selectedCuisine !== 'All'
                ? 'No matching restaurants'
                : 'Nothing on the menu just yet'}
            </Text>

            <Text style={styles.stateText}>
              {search || selectedCuisine !== 'All'
                ? 'Try another search or choose a different category.'
                : 'Restaurants will appear here as they become available.'}
            </Text>

            {(search || selectedCuisine !== 'All') && (
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  setSearch('');
                  setSelectedCuisine('All');
                }}
              >
                <Ionicons
                  name="options-outline"
                  size={17}
                  color={colors.background}
                />
                <Text style={styles.actionButtonText}>
                  Clear filters
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.restaurantList}>
            {filteredRestaurants.map(renderRestaurant)}
          </View>
        )}

        <View style={styles.bottomNote}>
          <View style={styles.bottomNoteIcon}>
            <Ionicons
              name="leaf-outline"
              size={18}
              color={colors.secondary}
            />
          </View>

          <View style={styles.bottomNoteContent}>
            <Text style={styles.bottomNoteTitle}>
              Made for your cravings
            </Text>
            <Text style={styles.bottomNoteText}>
              Good food, great choices, delivered to you.
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 125,
  },

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 28,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 9,
  },

  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: radius.round,
    backgroundColor: colors.secondary,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.25,
    color: colors.secondary,
  },

  heading: {
    fontSize: 35,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
  },

  headingAccent: {
    color: colors.primary,
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  headerIcon: {
    width: 58,
    height: 58,
    marginLeft: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerIconDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },

  searchContainer: {
    minHeight: 58,
    marginHorizontal: spacing.xl,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  searchIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 13,
    paddingVertical: 13,
  },

  clearSearchButton: {
    padding: 3,
  },

  sectionHeader: {
    marginTop: 30,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 12,
  },

  sectionAccent: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cuisineList: {
    paddingHorizontal: spacing.xl,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 9,
  },

  cuisineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  cuisineChipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },

  cuisineChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },

  cuisineChipTextSelected: {
    color: colors.background,
  },

  resultsHeader: {
    marginTop: 30,
    marginBottom: 16,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },

  resultsHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPressed: {
    opacity: 0.75,
  },

  restaurantList: {
    paddingHorizontal: spacing.xl,
    gap: 17,
  },

  restaurantCard: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },

  imageContainer: {
    height: 190,
    position: 'relative',
    backgroundColor: colors.surfaceAlt,
  },

  restaurantImage: {
    width: '100%',
    height: '100%',
  },

  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.06)',
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
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    marginTop: 9,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  imageBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },

  closedBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },

  closedDot: {
    width: 6,
    height: 6,
    borderRadius: radius.round,
    backgroundColor: colors.danger,
  },

  closedText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  deliveryBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },

  deliveryText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },

  restaurantInfo: {
    padding: 16,
  },

  restaurantTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  restaurantName: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },

  cuisineText: {
    marginTop: 7,
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '700',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },

  locationText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },

  description: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },

  cardFooter: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  footerDetail: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  footerText: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },

  viewMenuText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },

  stateContainer: {
    paddingHorizontal: 28,
    paddingVertical: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  stateIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },

  stateTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  stateText: {
    marginTop: 9,
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  actionButton: {
    marginTop: 19,
    paddingHorizontal: 19,
    paddingVertical: 12,
    borderRadius: 13,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  actionButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '800',
  },

  bottomNote: {
    marginHorizontal: spacing.xl,
    marginTop: 28,
    marginBottom: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  bottomNoteIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomNoteContent: {
    flex: 1,
  },

  bottomNoteTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },

  bottomNoteText: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
});
