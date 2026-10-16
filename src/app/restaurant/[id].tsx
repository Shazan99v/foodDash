import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../../constants/theme';
import {
  CustomerMenuItem,
  getCustomerRestaurant,
} from '../../services/customer/catalogApi';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';

type Restaurant = {
  _id: string;
  name: string;
  description?: string;
  banner?: string;
  logo?: string;
  images?: string[];
  isOpen?: boolean;
  deliveryFee?: number;
  averagePreparationTime?: number;
  rating?: number;
  totalRatings?: number;
};

type RestaurantResponse = {
  restaurant?: Restaurant;
  items?: CustomerMenuItem[];
  categories?: {
    _id: string;
    name: string;
  }[];
};

export default function RestaurantDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const restaurantId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = Boolean(user && token);

  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);

  const [restaurantData, setRestaurantData] =
    useState<RestaurantResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [guestModalVisible, setGuestModalVisible] = useState(false);
  const [failedImages, setFailedImages] =
    useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    let mounted = true;

    const loadRestaurant = async () => {
      if (!restaurantId) {
        setErrorMessage('Restaurant not found.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage('');

        const response = await getCustomerRestaurant(restaurantId);

        if (!mounted) return;

        const data = response?.data ?? response;

        setRestaurantData({
          restaurant: data?.restaurant ?? data,
          items: data?.items ?? data?.menuItems ?? [],
          categories: data?.categories ?? [],
        });
      } catch (error: any) {
        if (!mounted) return;

        setErrorMessage(
          error?.response?.data?.message ||
            'Unable to load this restaurant. Please try again.',
        );
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadRestaurant();

    return () => {
      mounted = false;
    };
  }, [restaurantId]);

  const restaurant = restaurantData?.restaurant;
  const menuItems = restaurantData?.items ?? [];

  const heroImage =
    restaurant?.banner ||
    restaurant?.logo ||
    restaurant?.images?.[0] ||
    '';

  const categories = useMemo(() => {
    const names = menuItems
      .map((item) =>
        typeof item.category === 'object'
          ? item.category?.name
          : undefined,
      )
      .filter((name): name is string => Boolean(name));

    return ['All', ...Array.from(new Set(names))];
  }, [menuItems]);

  const visibleItems = useMemo(() => {
    if (selectedCategory === 'All') return menuItems;

    return menuItems.filter(
      (item) =>
        typeof item.category === 'object' &&
        item.category?.name === selectedCategory,
    );
  }, [menuItems, selectedCategory]);

  const restaurantCartItems = cartItems.filter(
    (item: any) => item.restaurantId === restaurant?._id,
  );

  const cartCount = restaurantCartItems.reduce(
    (total: number, item: any) => total + (item.quantity || 1),
    0,
  );

  const cartSubtotal = restaurantCartItems.reduce(
    (total: number, item: any) =>
      total + item.price * (item.quantity || 1),
    0,
  );

  const requireLogin = () => setGuestModalVisible(true);

  const handleAddToCart = (item: CustomerMenuItem) => {
    if (!isAuthenticated) {
      requireLogin();
      return;
    }

    if (!restaurant || !restaurant.isOpen || !item.isAvailable) return;

    const price =
      typeof item.discountedPrice === 'number' &&
      item.discountedPrice > 0
        ? item.discountedPrice
        : item.price;

    addItem({
      id: item._id,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      name: item.name,
      image: item.image || '',
      price,
    });
  };

  const handleCartPress = () => {
    if (!isAuthenticated) {
      requireLogin();
      return;
    }

    router.push('/cart');
  };

  const handleLogin = () => {
    setGuestModalVisible(false);
    router.push('/login');
  };

  const handleSignUp = () => {
    setGuestModalVisible(false);
    router.push('/register');
  };

  const formatPrice = (price: number) =>
    `Rs. ${Number(price || 0).toLocaleString('en-PK')}`;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingIcon}>
          <Ionicons
            name="restaurant-outline"
            size={32}
            color={colors.primary}
          />
        </View>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loadingSpinner}
        />
        <Text style={styles.loadingText}>Preparing the menu...</Text>
        <Text style={styles.loadingHint}>
          Finding something delicious for you.
        </Text>
      </View>
    );
  }

  if (errorMessage || !restaurant) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIcon}>
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color={colors.primary}
          />
        </View>
        <Text style={styles.errorTitle}>Restaurant unavailable</Text>
        <Text style={styles.errorMessage}>
          {errorMessage || 'This restaurant could not be found.'}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color={colors.black} />
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: cartCount > 0 ? 130 : 36,
        }}
      >
        <View style={styles.heroContainer}>
          {heroImage && !failedImages.restaurant ? (
            <Image
              source={{ uri: heroImage }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() =>
                setFailedImages((previous) => ({
                  ...previous,
                  restaurant: true,
                }))
              }
            />
          ) : (
            <View style={styles.heroFallback}>
              <View style={styles.heroFallbackIcon}>
                <Ionicons
                  name="restaurant-outline"
                  size={54}
                  color={colors.secondary}
                />
              </View>
              <Text style={styles.heroFallbackText}>{restaurant.name}</Text>
            </View>
          )}

          <View style={styles.heroOverlay} />

          <Pressable
            style={[styles.backButton, { top: insets.top + 10 }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>

          <View style={styles.heroBrand}>
            <View style={styles.brandDot} />
            <Text style={styles.heroBrandText}>FOODDASH</Text>
          </View>

          <View style={styles.heroBadge}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: restaurant.isOpen
                    ? colors.success
                    : colors.danger,
                },
              ]}
            />
            <Text style={styles.heroBadgeText}>
              {restaurant.isOpen ? 'OPEN NOW' : 'CURRENTLY CLOSED'}
            </Text>
          </View>
        </View>

        <View style={styles.restaurantInfo}>
          <View style={styles.restaurantTitleRow}>
            <View style={styles.restaurantTitleContent}>
              <Text style={styles.eyebrow}>GOOD FOOD STARTS HERE</Text>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
            </View>

            <View style={styles.restaurantMark}>
              <Ionicons
                name="restaurant"
                size={23}
                color={colors.secondary}
              />
            </View>
          </View>

          {!!restaurant.description && (
            <Text style={styles.description}>{restaurant.description}</Text>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Ionicons name="star" size={17} color={colors.secondary} />
              </View>
              <Text style={styles.infoValue}>
                {typeof restaurant.rating === 'number'
                  ? restaurant.rating.toFixed(1)
                  : 'New'}
              </Text>
              <Text style={styles.infoLabel}>Rating</Text>
              {!!restaurant.totalRatings && (
                <Text style={styles.infoHint}>
                  {restaurant.totalRatings} reviews
                </Text>
              )}
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.infoValue}>
                {restaurant.averagePreparationTime
                  ? `${restaurant.averagePreparationTime} min`
                  : 'Varies'}
              </Text>
              <Text style={styles.infoLabel}>Preparation</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="bicycle-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.infoValue}>
                {typeof restaurant.deliveryFee === 'number'
                  ? formatPrice(restaurant.deliveryFee)
                  : 'Delivery'}
              </Text>
              <Text style={styles.infoLabel}>Delivery fee</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuSectionHeader}>
          <View>
            <Text style={styles.eyebrow}>MADE TO BE ENJOYED</Text>
            <Text style={styles.sectionTitle}>Explore the menu</Text>
            <Text style={styles.sectionSubtitle}>
              {menuItems.length} {menuItems.length === 1 ? 'item' : 'items'} on
              the menu
            </Text>
          </View>

          <View style={styles.menuCountBadge}>
            <Ionicons
              name="fast-food-outline"
              size={19}
              color={colors.secondary}
            />
            <Text style={styles.menuCountText}>{menuItems.length}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map((category) => {
            const active = category === selectedCategory;

            return (
              <Pressable
                key={category}
                style={[
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                {active ? (
                  <Ionicons
                    name="checkmark"
                    size={15}
                    color={colors.black}
                  />
                ) : null}
                <Text
                  style={[
                    styles.categoryChipText,
                    active && styles.categoryChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {visibleItems.length === 0 ? (
          <View style={styles.emptyMenu}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="fast-food-outline"
                size={34}
                color={colors.textSecondary}
              />
            </View>
            <Text style={styles.emptyMenuTitle}>Nothing on the menu yet</Text>
            <Text style={styles.emptyMenuText}>
              No menu items were found in this category.
            </Text>
          </View>
        ) : (
          <View style={styles.menuList}>
            {visibleItems.map((item) => {
              const imageKey = `item-${item._id}`;
              const imageFailed = failedImages[imageKey];
              const itemImage = item.image || '';

              const price =
                typeof item.discountedPrice === 'number' &&
                item.discountedPrice > 0
                  ? item.discountedPrice
                  : item.price;

              const canAdd = Boolean(item.isAvailable && restaurant.isOpen);

              return (
                <View key={item._id} style={styles.menuCard}>
                  <View style={styles.menuImageContainer}>
                    {itemImage && !imageFailed ? (
                      <Image
                        source={{ uri: itemImage }}
                        style={styles.menuImage}
                        resizeMode="cover"
                        onError={() =>
                          setFailedImages((previous) => ({
                            ...previous,
                            [imageKey]: true,
                          }))
                        }
                      />
                    ) : (
                      <View style={styles.menuImageFallback}>
                        <Ionicons
                          name="fast-food-outline"
                          size={37}
                          color={colors.primary}
                        />
                      </View>
                    )}

                    {typeof item.discountedPrice === 'number' &&
                    item.discountedPrice > 0 &&
                    item.discountedPrice < item.price ? (
                      <View style={styles.saleBadge}>
                        <Text style={styles.saleBadgeText}>DEAL</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.menuDetails}>
                    <View style={styles.menuTitleRow}>
                      <Text style={styles.menuName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <View style={styles.itemAccent} />
                    </View>

                    {!!item.description && (
                      <Text style={styles.menuDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}

                    <View style={styles.menuBottom}>
                      <View style={styles.priceRow}>
                        <Text style={styles.menuPrice}>{formatPrice(price)}</Text>

                        {typeof item.discountedPrice === 'number' &&
                        item.discountedPrice > 0 &&
                        item.discountedPrice < item.price ? (
                          <Text style={styles.oldPrice}>
                            {formatPrice(item.price)}
                          </Text>
                        ) : null}
                      </View>

                      {!item.isAvailable ? (
                        <Text style={styles.unavailableText}>
                          Currently unavailable
                        </Text>
                      ) : !restaurant.isOpen ? (
                        <Text style={styles.unavailableText}>
                          Restaurant closed
                        </Text>
                      ) : null}

                      <TouchableOpacity
                        style={[
                          styles.addButton,
                          !canAdd && styles.addButtonDisabled,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => handleAddToCart(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`${
                          canAdd ? 'Add' : 'Unavailable'
                        } ${item.name} to cart`}
                      >
                        <Ionicons
                          name={canAdd ? 'add' : 'remove'}
                          size={17}
                          color={canAdd ? colors.black : colors.textLight}
                        />
                        <Text
                          style={[
                            styles.addButtonText,
                            !canAdd && styles.addButtonTextDisabled,
                          ]}
                        >
                          {!item.isAvailable
                            ? 'Unavailable'
                            : !restaurant.isOpen
                              ? 'Restaurant Closed'
                              : 'Add to Cart'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {!isAuthenticated && (
          <View style={styles.guestNotice}>
            <View style={styles.guestNoticeIcon}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.secondary}
              />
            </View>
            <View style={styles.guestNoticeContent}>
              <Text style={styles.guestNoticeTitle}>Browsing as a guest</Text>
              <Text style={styles.guestNoticeText}>
                Explore the menu freely. Sign in to add food to your cart and
                place an order.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {cartCount > 0 && (
        <View
          style={[
            styles.cartBar,
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          <View style={styles.cartSummary}>
            <View style={styles.cartIcon}>
              <Ionicons
                name="bag-handle-outline"
                size={20}
                color={colors.secondary}
              />
              <View style={styles.cartCountBadge}>
                <Text style={styles.cartCountBadgeText}>{cartCount}</Text>
              </View>
            </View>
            <View>
              <Text style={styles.cartCount}>
                {cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart
              </Text>
              <Text style={styles.cartSubtotal}>
                {formatPrice(cartSubtotal)}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.viewCartButton,
              pressed && styles.pressed,
            ]}
            onPress={handleCartPress}
          >
            <Text style={styles.viewCartText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.black} />
          </Pressable>
        </View>
      )}

      <Modal
        visible={guestModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setGuestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalAccent} />
            <View style={styles.modalIcon}>
              <Ionicons
                name="person-outline"
                size={29}
                color={colors.primary}
              />
            </View>

            <Text style={styles.modalEyebrow}>ONE QUICK STEP</Text>
            <Text style={styles.modalTitle}>Your next meal awaits</Text>

            <Text style={styles.modalMessage}>
              Sign in or create a customer account to add items to your cart and
              place your order.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.modalLoginButton,
                pressed && styles.pressed,
              ]}
              onPress={handleLogin}
            >
              <Text style={styles.modalLoginText}>Log In</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.black} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.modalSignupButton,
                pressed && styles.pressed,
              ]}
              onPress={handleSignUp}
            >
              <Text style={styles.modalSignupText}>Create an account</Text>
            </Pressable>

            <Pressable
              style={styles.modalCancelButton}
              onPress={() => setGuestModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Continue browsing</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingSpinner: {
    marginTop: spacing.xl,
  },
  loadingText: {
    color: colors.text,
    marginTop: spacing.lg,
    fontSize: 18,
    fontWeight: '800',
  },
  loadingHint: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontSize: 12,
    textAlign: 'center',
  },
  errorIcon: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  primaryButton: {
    marginTop: spacing.xl,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    color: colors.black,
    fontWeight: '900',
    fontSize: 14,
  },
  heroContainer: {
    height: 285,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.surfaceAlt,
  },
  heroFallbackIcon: {
    width: 82,
    height: 82,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroFallbackText: {
    marginTop: spacing.md,
    color: colors.text,
    fontWeight: '900',
    fontSize: 21,
    textAlign: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 10, 11, 0.16)',
  },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: 'rgba(17, 19, 21, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 240, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBrand: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: 'rgba(17, 19, 21, 0.88)',
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  heroBrandText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  heroBadge: {
    position: 'absolute',
    left: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.round,
    backgroundColor: 'rgba(17, 19, 21, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 240, 0.12)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroBadgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  restaurantInfo: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  restaurantTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  restaurantTitleContent: {
    flex: 1,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: spacing.xs,
  },
  restaurantName: {
    color: colors.text,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
  },
  restaurantMark: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    marginTop: spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  infoCard: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoIcon: {
    width: 33,
    height: 33,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.sm,
  },
  infoValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  infoHint: {
    color: colors.textLight,
    fontSize: 9,
    marginTop: 3,
  },
  menuSectionHeader: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  menuCountBadge: {
    minWidth: 52,
    height: 48,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuCountText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  categoryList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  categoryChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  categoryChipTextActive: {
    color: colors.black,
  },
  menuList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  menuCard: {
    flexDirection: 'row',
    padding: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    overflow: 'hidden',
  },
  menuImageContainer: {
    width: 116,
    minHeight: 145,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    position: 'relative',
  },
  menuImage: {
    width: '100%',
    height: '100%',
  },
  menuImageFallback: {
    flex: 1,
    minHeight: 145,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  saleBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
  },
  saleBadgeText: {
    color: colors.black,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  menuDetails: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  menuTitleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  menuName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },
  itemAccent: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 6,
    backgroundColor: colors.primary,
  },
  menuDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.xs,
  },
  menuBottom: {
    flex: 1,
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingTop: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuPrice: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: '900',
  },
  oldPrice: {
    color: colors.textLight,
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  unavailableText: {
    color: colors.danger,
    fontSize: 10,
    marginTop: spacing.xs,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    marginTop: spacing.sm,
  },
  addButtonDisabled: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addButtonText: {
    color: colors.black,
    fontSize: 10,
    fontWeight: '900',
  },
  addButtonTextDisabled: {
    color: colors.textLight,
  },
  emptyMenu: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyMenuTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  emptyMenuText: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 19,
  },
  guestNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  guestNoticeIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  guestNoticeContent: {
    flex: 1,
  },
  guestNoticeTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  guestNoticeText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 18,
  },
  cartBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cartSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  cartIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    position: 'relative',
  },
  cartCountBadge: {
    position: 'absolute',
    right: -4,
    top: -5,
    minWidth: 18,
    height: 18,
    borderRadius: radius.round,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  cartCountBadgeText: {
    color: colors.black,
    fontSize: 9,
    fontWeight: '900',
  },
  cartCount: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  cartSubtotal: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 47,
  },
  viewCartText: {
    color: colors.black,
    fontWeight: '900',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 26,
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  modalAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.primary,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalEyebrow: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: spacing.sm,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  modalLoginButton: {
    width: '100%',
    minHeight: 51,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  modalLoginText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900',
  },
  modalSignupButton: {
    width: '100%',
    minHeight: 49,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSignupText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  modalCancelButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
  },
});
