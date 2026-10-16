import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
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

type DealRestaurant = {
  _id: string;
  name: string;
  logo?: string;
  banner?: string;
  isOpen?: boolean;
  area?: string;
  city?: string;
};

type Deal = {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  discountedPrice: number;
  discountPercentage?: number;
  isAvailable?: boolean;
  restaurant: DealRestaurant | string;
  category?: { name?: string } | string;
};

export default function DealsScreen() {
  const router = useRouter();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const refreshRotation = useRef(new Animated.Value(0)).current;
  const refreshScale = useRef(new Animated.Value(1)).current;
  const refreshAnimation =
    useRef<Animated.CompositeAnimation | null>(null);

  const loadDeals = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const response = await api.get('/catalog/deals');
      const payload = response.data;

      const receivedDeals: Deal[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.deals)
          ? payload.deals
          : [];

      const validDeals = receivedDeals.filter((deal) => {
        const restaurant = deal?.restaurant;

        return (
          deal &&
          typeof restaurant === 'object' &&
          restaurant !== null &&
          Number(deal.price) > Number(deal.discountedPrice) &&
          Number(deal.discountedPrice) >= 0 &&
          deal.isAvailable !== false
        );
      });

      setDeals(validDeals);
    } catch (err) {
      console.error('Failed to load deals:', err);
      setError(
        'We could not load deals. Check your connection and try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  useEffect(() => {
    if (refreshing) {
      refreshRotation.setValue(0);
      refreshScale.setValue(1);

      const rotationLoop = Animated.loop(
        Animated.timing(refreshRotation, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        })
      );

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(refreshScale, {
            toValue: 1.15,
            duration: 420,
            useNativeDriver: true,
          }),
          Animated.timing(refreshScale, {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
          }),
        ])
      );

      refreshAnimation.current = Animated.parallel([
        rotationLoop,
        pulseLoop,
      ]);

      refreshAnimation.current.start();

      return () => {
        refreshAnimation.current?.stop();
        refreshAnimation.current = null;
      };
    }

    refreshAnimation.current?.stop();
    refreshAnimation.current = null;
    refreshRotation.setValue(0);
    refreshScale.setValue(1);
  }, [refreshing, refreshRotation, refreshScale]);

  const filteredDeals = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return deals;

    return deals.filter((deal) => {
      const restaurant = deal.restaurant as DealRestaurant;
      const category =
        typeof deal.category === 'object'
          ? deal.category?.name || ''
          : deal.category || '';

      return [
        deal.name,
        deal.description || '',
        restaurant.name,
        restaurant.area || '',
        restaurant.city || '',
        category,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [deals, search]);

  const openRestaurant = (deal: Deal) => {
    const restaurant = deal.restaurant as DealRestaurant;

    if (!restaurant?._id) return;

    router.push({
      pathname: '/restaurant/[id]',
      params: { id: restaurant._id },
    });
  };

  const renderDeal = (deal: Deal) => {
    const restaurant = deal.restaurant as DealRestaurant;

    const discount =
      deal.discountPercentage ??
      Math.round(
        ((Number(deal.price) - Number(deal.discountedPrice)) /
          Number(deal.price)) *
          100
      );

    const imageUri = deal.image || '';

    return (
      <Pressable
        key={deal._id}
        style={({ pressed }) => [
          styles.dealCard,
          pressed && styles.cardPressed,
        ]}
        onPress={() => openRestaurant(deal)}
        accessibilityRole="button"
        accessibilityLabel={`View ${deal.name} deal from ${restaurant.name}`}
      >
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.foodImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.placeholderIcon}>
                <Ionicons
                  name="fast-food-outline"
                  size={32}
                  color={colors.secondary}
                />
              </View>
              <Text style={styles.placeholderText}>FOOD DEAL</Text>
            </View>
          )}

          <View style={styles.discountBadge}>
            <Ionicons
              name="pricetag"
              size={12}
              color={colors.background}
            />
            <Text style={styles.discountText}>
              {discount}% OFF
            </Text>
          </View>

          {restaurant.isOpen === false && (
            <View style={styles.closedBadge}>
              <View style={styles.closedDot} />
              <Text style={styles.closedText}>Closed</Text>
            </View>
          )}
        </View>

        <View style={styles.dealContent}>
          <View style={styles.dealTopRow}>
            <Text style={styles.dealName} numberOfLines={2}>
              {deal.name}
            </Text>

            <View style={styles.dealArrow}>
              <Ionicons
                name="arrow-up-outline"
                size={15}
                color={colors.text}
              />
            </View>
          </View>

          <View style={styles.restaurantRow}>
            <Ionicons
              name="restaurant-outline"
              size={14}
              color={colors.secondary}
            />
            <Text style={styles.restaurantName} numberOfLines={1}>
              {restaurant.name}
            </Text>
          </View>

          {!!deal.description && (
            <Text style={styles.description} numberOfLines={2}>
              {deal.description}
            </Text>
          )}

          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.discountedPrice}>
                Rs. {Number(deal.discountedPrice).toLocaleString()}
              </Text>

              <Text style={styles.originalPrice}>
                Rs. {Number(deal.price).toLocaleString()}
              </Text>
            </View>

            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>
                Save Rs.{' '}
                {(
                  Number(deal.price) -
                  Number(deal.discountedPrice)
                ).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.orderHint}>
            <Text style={styles.orderHintText}>
              View restaurant
            </Text>
            <Ionicons
              name="arrow-forward-circle"
              size={20}
              color={colors.primary}
            />
          </View>
        </View>
      </Pressable>
    );
  };

  const refreshIconRotation = refreshRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDeals(true)}
            tintColor={colors.secondary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrow}>
                GOOD FOOD. BETTER PRICES.
              </Text>
            </View>

            <Text style={styles.title}>
              Food Deals<Text style={styles.titleAccent}>.</Text>
            </Text>

            <Text style={styles.subtitle}>
              Your favourites, for less.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.refreshPressed,
            ]}
            onPress={() => loadDeals(true)}
            disabled={refreshing || loading}
            accessibilityRole="button"
            accessibilityLabel="Refresh food deals"
          >
            <Animated.View
              style={{
                transform: [
                  { rotate: refreshIconRotation },
                  { scale: refreshScale },
                ],
              }}
            >
              <Ionicons
                name="refresh-outline"
                size={24}
                color={colors.secondary}
              />
            </Animated.View>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="flash"
              size={25}
              color={colors.background}
            />
          </View>

          <View style={styles.heroTextContainer}>
            <Text style={styles.heroKicker}>LIMITED-TIME SAVINGS</Text>
            <Text style={styles.heroTitle}>
              Big flavour. Better prices.
            </Text>
            <Text style={styles.heroSubtitle}>
              More of what you love, for less.
            </Text>
          </View>

          <View style={styles.heroSparkle}>
            <Ionicons
              name="sparkles"
              size={23}
              color={colors.secondary}
            />
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
            style={styles.searchInput}
            placeholder="Search food or restaurants..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCapitalize="none"
            clearButtonMode="never"
            accessibilityLabel="Search food deals"
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={21}
                color={colors.textSecondary}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeadingContent}>
            <Text style={styles.sectionTitle}>
              {search.trim() ? 'Search results' : 'Deals worth grabbing'}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {loading
                ? 'Finding the best offers...'
                : `${filteredDeals.length} ${
                    filteredDeals.length === 1 ? 'deal' : 'deals'
                  } to explore`}
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Ionicons
              name="pricetags-outline"
              size={15}
              color={colors.secondary}
            />
            <Text style={styles.countText}>
              {filteredDeals.length}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <View style={styles.stateIcon}>
              <ActivityIndicator
                size="large"
                color={colors.secondary}
              />
            </View>

            <Text style={styles.stateTitle}>
              Finding tasty deals...
            </Text>

            <Text style={styles.stateSubtitle}>
              Just a moment while we load your offers.
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <View style={styles.stateIcon}>
              <Ionicons
                name="cloud-offline-outline"
                size={32}
                color={colors.danger}
              />
            </View>

            <Text style={styles.stateTitle}>
              Deals are taking a break
            </Text>

            <Text style={styles.stateSubtitle}>{error}</Text>

            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => loadDeals()}
            >
              <Ionicons
                name="refresh"
                size={17}
                color={colors.background}
              />
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : filteredDeals.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.stateIcon}>
              <Ionicons
                name={search.trim() ? 'search-outline' : 'pricetags-outline'}
                size={32}
                color={colors.secondary}
              />
            </View>

            <Text style={styles.stateTitle}>
              {search.trim()
                ? 'No matching deals'
                : 'No deals available yet'}
            </Text>

            <Text style={styles.stateSubtitle}>
              {search.trim()
                ? 'Try another food or restaurant name.'
                : 'Check back soon for delicious discounts.'}
            </Text>

            {search.trim() ? (
              <Pressable
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setSearch('')}
              >
                <Ionicons
                  name="close"
                  size={17}
                  color={colors.background}
                />
                <Text style={styles.retryText}>Clear search</Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => loadDeals(true)}
              >
                <Ionicons
                  name="refresh"
                  size={17}
                  color={colors.background}
                />
                <Text style={styles.retryText}>Refresh deals</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.dealsList}>
            {filteredDeals.map(renderDeal)}
          </View>
        )}

        <View style={styles.bottomNote}>
          <View style={styles.bottomNoteIcon}>
            <Ionicons
              name="heart-outline"
              size={18}
              color={colors.secondary}
            />
          </View>

          <View style={styles.bottomNoteContent}>
            <Text style={styles.bottomNoteTitle}>
              A little more joy in every order
            </Text>
            <Text style={styles.bottomNoteText}>
              Great food doesn't have to cost more.
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 25,
    paddingBottom: 125,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
    gap: 12,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },

  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: radius.round,
    backgroundColor: colors.secondary,
  },

  eyebrow: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },

  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  titleAccent: {
    color: colors.primary,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 5,
  },

  refreshButton: {
    width: 49,
    height: 49,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  refreshPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },

  hero: {
    minHeight: 122,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },

  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  heroTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  heroKicker: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },

  heroTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 5,
  },

  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },

  heroSparkle: {
    marginLeft: 5,
    alignSelf: 'flex-start',
  },

  searchContainer: {
    minHeight: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 10,
    marginBottom: 28,
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
    paddingVertical: 14,
  },

  clearButton: {
    padding: 3,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },

  sectionHeadingContent: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },

  countBadge: {
    minWidth: 44,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  countText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  dealsList: {
    gap: 15,
  },

  dealCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    minHeight: 160,
    overflow: 'hidden',
  },

  cardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },

  imageContainer: {
    width: 116,
    minHeight: 138,
    alignSelf: 'stretch',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    position: 'relative',
  },

  foodImage: {
    width: '100%',
    height: '100%',
    minHeight: 138,
  },

  imagePlaceholder: {
    flex: 1,
    minHeight: 138,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceAlt,
  },

  placeholderIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  discountBadge: {
    position: 'absolute',
    top: 7,
    left: 6,
    backgroundColor: colors.secondary,
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  discountText: {
    color: colors.background,
    fontSize: 9,
    fontWeight: '900',
  },

  closedBadge: {
    position: 'absolute',
    bottom: 7,
    left: 6,
    backgroundColor: colors.background,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  closedDot: {
    width: 6,
    height: 6,
    borderRadius: radius.round,
    backgroundColor: colors.danger,
  },

  closedText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '800',
  },

  dealContent: {
    flex: 1,
    paddingVertical: 4,
    paddingLeft: 12,
    justifyContent: 'center',
    minWidth: 0,
  },

  dealTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },

  dealName: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },

  dealArrow: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },

  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },

  restaurantName: {
    color: colors.textSecondary,
    fontSize: 11,
    flex: 1,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 7,
  },

  priceSection: {
    marginTop: 10,
    gap: 7,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },

  discountedPrice: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: '900',
  },

  originalPrice: {
    color: colors.textLight,
    fontSize: 10,
    textDecorationLine: 'line-through',
  },

  savingsBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: colors.surfaceAlt,
  },

  savingsText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '800',
  },

  orderHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 9,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  orderHintText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },

  centerState: {
    minHeight: 245,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
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
    marginBottom: 5,
  },

  stateTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },

  stateSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 7,
    maxWidth: 290,
  },

  retryButton: {
    marginTop: 18,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 13,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  retryText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '800',
  },

  buttonPressed: {
    opacity: 0.75,
  },

  bottomNote: {
    marginTop: 26,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
});
