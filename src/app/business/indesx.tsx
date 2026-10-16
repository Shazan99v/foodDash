import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useAuthStore } from '../../stores/authStore';
import {
  getMyRestaurant,
  updateRestaurantStatus,
  type BusinessRestaurant,
} from '../../services/business/businessApi';
import { colors, radius, spacing } from '../../constants/theme';

export default function BusinessDashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [restaurant, setRestaurant] =
    useState<BusinessRestaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRestaurant = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getMyRestaurant();
      setRestaurant(data);
    } catch (err: any) {
      console.error('Load business restaurant error:', err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load your restaurant.';

      setError(message);

      Toast.show({
        type: 'error',
        text1: 'Restaurant unavailable',
        text2: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRestaurant();
    }, [loadRestaurant])
  );

  const handleRestaurantStatusChange = async (
    nextIsOpen: boolean
  ) => {
    if (!restaurant || isUpdatingStatus) return;

    const previousRestaurant = restaurant;

    setRestaurant({
      ...previousRestaurant,
      isOpen: nextIsOpen,
    });
    setIsUpdatingStatus(true);

    try {
      const updatedRestaurant =
        await updateRestaurantStatus(nextIsOpen);

      setRestaurant(updatedRestaurant);

      Toast.show({
        type: 'success',
        text1: nextIsOpen ? 'Restaurant opened' : 'Restaurant closed',
        text2: nextIsOpen
          ? 'Customers can now place orders.'
          : 'Customers can no longer place new orders.',
      });
    } catch (err: any) {
      console.error('Update restaurant status error:', err);
      setRestaurant(previousRestaurant);

      Toast.show({
        type: 'error',
        text1: 'Status update failed',
        text2:
          err?.response?.data?.message ||
          err?.message ||
          'Unable to update restaurant status.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await logout();
      router.replace('/');
    } catch (err: any) {
      console.error('Business logout error:', err);

      Toast.show({
        type: 'error',
        text1: 'Logout failed',
        text2: err?.message || 'Please try again.',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingLogo}>
            <Ionicons
              name="storefront"
              size={31}
              color={colors.black}
            />
          </View>

          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingTitle}>
            Loading restaurant
          </Text>
          <Text style={styles.loadingText}>
            Getting your business dashboard ready...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !restaurant) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="storefront-outline"
              size={38}
              color={colors.danger}
            />
          </View>

          <Text style={styles.errorEyebrow}>BUSINESS DASHBOARD</Text>
          <Text style={styles.errorTitle}>
            Restaurant unavailable
          </Text>
          <Text style={styles.errorDescription}>
            {error || 'Your restaurant could not be loaded.'}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => void loadRestaurant()}
          >
            <Ionicons
              name="refresh-outline"
              size={19}
              color={colors.black}
            />
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.errorLogoutButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => void handleLogout()}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Ionicons
                  name="log-out-outline"
                  size={19}
                  color={colors.danger}
                />
                <Text style={styles.errorLogoutText}>Logout</Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isOpen = restaurant.isOpen === true;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrow}>BUSINESS PORTAL</Text>
            </View>

            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.name} numberOfLines={2}>
              {restaurant.name}
            </Text>
            <Text style={styles.headerSubtitle}>
              Your restaurant, your control.
            </Text>
          </View>

          <View style={styles.logoCircle}>
            <Ionicons
              name="storefront"
              size={29}
              color={colors.black}
            />
          </View>
        </View>

        <View
          style={[
            styles.statusCard,
            isOpen && styles.statusCardOpen,
          ]}
        >
          <View
            style={[
              styles.statusIcon,
              isOpen && styles.statusIconOpen,
            ]}
          >
            <Ionicons
              name={isOpen ? 'checkmark-circle' : 'close-circle'}
              size={25}
              color={isOpen ? colors.secondary : colors.danger}
            />
          </View>

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              {isOpen ? 'Restaurant is Open' : 'Restaurant is Closed'}
            </Text>

            <Text style={styles.statusText}>
              {isOpen
                ? 'Customers can currently place orders.'
                : 'Your restaurant is not accepting new orders.'}
            </Text>
          </View>

          <View style={styles.statusControl}>
            <View
              style={[
                styles.activeBadge,
                isOpen ? styles.openBadge : styles.closedBadge,
              ]}
            >
              <View
                style={[
                  styles.activeDot,
                  isOpen ? styles.openDot : styles.closedDot,
                ]}
              />
              <Text
                style={[
                  styles.activeText,
                  isOpen ? styles.openText : styles.closedText,
                ]}
              >
                {isOpen ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>

            <Switch
              value={isOpen}
              onValueChange={(value) =>
                void handleRestaurantStatusChange(value)
              }
              disabled={isUpdatingStatus}
              trackColor={{
                false: colors.border,
                true: colors.primary,
              }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
              accessibilityRole="switch"
              accessibilityLabel="Restaurant open or closed"
            />
          </View>
        </View>

        {isUpdatingStatus && (
          <View style={styles.statusUpdating}>
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />
            <Text style={styles.statusUpdatingText}>
              Updating restaurant status...
            </Text>
          </View>
        )}

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>
              Restaurant details
            </Text>
            <Text style={styles.sectionSubtitle}>
              Your location and contact information
            </Text>
          </View>
          <View style={styles.sectionAccent} />
        </View>

        <View style={styles.restaurantCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="location-outline"
                size={21}
                color={colors.primary}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>LOCATION</Text>
              <Text style={styles.infoValue}>
                {[restaurant.area, restaurant.city]
                  .filter(Boolean)
                  .join(', ') || 'Not provided'}
              </Text>
              {!!restaurant.address && (
                <Text style={styles.infoSecondary}>
                  {restaurant.address}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, styles.infoIconLime]}>
              <Ionicons
                name="call-outline"
                size={20}
                color={colors.secondary}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>PHONE NUMBER</Text>
              <Text style={styles.infoValue}>
                {restaurant.phone || 'Not provided'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Performance</Text>
            <Text style={styles.sectionSubtitle}>
              Your restaurant at a glance
            </Text>
          </View>
          <View style={styles.sectionAccent} />
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statTopRow}>
              <View style={styles.statIcon}>
                <Ionicons
                  name="receipt-outline"
                  size={21}
                  color={colors.primary}
                />
              </View>
              <Ionicons
                name="trending-up-outline"
                size={17}
                color={colors.textLight}
              />
            </View>

            <Text style={styles.statValue}>
              {restaurant.totalOrders ?? 0}
            </Text>
            <Text style={styles.statLabel}>Total Orders</Text>
            <View style={styles.statAccent} />
          </View>

          <View style={styles.statCard}>
            <View style={styles.statTopRow}>
              <View style={[styles.statIcon, styles.statIconLime]}>
                <Ionicons
                  name="star-outline"
                  size={21}
                  color={colors.secondary}
                />
              </View>
              <Ionicons
                name="sparkles-outline"
                size={17}
                color={colors.textLight}
              />
            </View>

            <Text style={styles.statValue}>
              {(restaurant.rating ?? 0).toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
            <View style={[styles.statAccent, styles.statAccentLime]} />
          </View>

          <View style={styles.statCard}>
            <View style={styles.statTopRow}>
              <View style={[styles.statIcon, styles.statIconLime]}>
                <Ionicons
                  name="people-outline"
                  size={21}
                  color={colors.secondary}
                />
              </View>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={17}
                color={colors.textLight}
              />
            </View>

            <Text style={styles.statValue}>
              {restaurant.totalRatings ?? 0}
            </Text>
            <Text style={styles.statLabel}>Total Ratings</Text>
            <View style={[styles.statAccent, styles.statAccentLime]} />
          </View>

          <View style={styles.statCard}>
            <View style={styles.statTopRow}>
              <View style={styles.statIcon}>
                <Ionicons
                  name="bicycle-outline"
                  size={21}
                  color={colors.primary}
                />
              </View>
              <Ionicons
                name="wallet-outline"
                size={17}
                color={colors.textLight}
              />
            </View>

            <Text style={styles.statValue}>
              Rs. {restaurant.deliveryFee ?? 0}
            </Text>
            <Text style={styles.statLabel}>Delivery Fee</Text>
            <View style={styles.statAccent} />
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>
              Manage your restaurant
            </Text>
            <Text style={styles.sectionSubtitle}>
              Quick access to daily operations
            </Text>
          </View>
        </View>

        <View style={styles.managementCard}>
          <Pressable
            style={({ pressed }) => [
              styles.managementRow,
              pressed && styles.rowPressed,
            ]}
            onPress={() => router.push('/business/orders')}
            accessibilityRole="button"
          >
            <View style={styles.managementIcon}>
              <Ionicons
                name="receipt-outline"
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Orders</Text>
              <Text style={styles.managementText}>
                Review and manage incoming orders
              </Text>
            </View>

            <View style={styles.chevronCircle}>
              <Ionicons
                name="chevron-forward"
                size={17}
                color={colors.textSecondary}
              />
            </View>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [
              styles.managementRow,
              pressed && styles.rowPressed,
            ]}
            onPress={() => router.push('/business/categories')}
            accessibilityRole="button"
          >
            <View style={[styles.managementIcon, styles.limeIcon]}>
              <Ionicons
                name="grid-outline"
                size={22}
                color={colors.secondary}
              />
            </View>

            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Categories</Text>
              <Text style={styles.managementText}>
                Enable or disable food categories
              </Text>
            </View>

            <View style={styles.chevronCircle}>
              <Ionicons
                name="chevron-forward"
                size={17}
                color={colors.textSecondary}
              />
            </View>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [
              styles.managementRow,
              pressed && styles.rowPressed,
            ]}
            onPress={() => router.push('/business/menu-items')}
            accessibilityRole="button"
          >
            <View style={styles.managementIcon}>
              <Ionicons
                name="fast-food-outline"
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Menu Items</Text>
              <Text style={styles.managementText}>
                Control which items customers can order
              </Text>
            </View>

            <View style={styles.chevronCircle}>
              <Ionicons
                name="chevron-forward"
                size={17}
                color={colors.textSecondary}
              />
            </View>
          </Pressable>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Account</Text>
            <Text style={styles.sectionSubtitle}>
              Your business account information
            </Text>
          </View>
        </View>

        <View style={styles.accountCard}>
          <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
              <Ionicons
                name="person-outline"
                size={19}
                color={colors.primary}
              />
            </View>

            <View style={styles.accountContent}>
              <Text style={styles.accountLabel}>OWNER</Text>
              <Text style={styles.accountValue}>
                {user?.name || 'Business Owner'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.accountRow}>
            <View style={[styles.accountIcon, styles.accountIconLime]}>
              <Ionicons
                name="mail-outline"
                size={19}
                color={colors.secondary}
              />
            </View>

            <View style={styles.accountContent}>
              <Text style={styles.accountLabel}>EMAIL ADDRESS</Text>
              <Text style={styles.accountValue}>
                {user?.email || 'No email'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => void handleLogout()}
          disabled={isLoggingOut}
          accessibilityRole="button"
        >
          {isLoggingOut ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <>
              <Ionicons
                name="log-out-outline"
                size={20}
                color={colors.danger}
              />
              <Text style={styles.logoutText}>Logout</Text>
              <View style={styles.logoutSpacer} />
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textLight}
              />
            </>
          )}
        </Pressable>

        <Text style={styles.footerText}>
          FOODDASH  ·  BUSINESS PORTAL
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingLogo: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: spacing.lg,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorIcon: {
    width: 82,
    height: 82,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorEyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 350,
  },
  retryButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  retryText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900',
  },
  errorLogoutButton: {
    width: '100%',
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  errorLogoutText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  name: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '900',
    marginTop: 3,
  },
  headerSubtitle: {
    color: colors.textLight,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusCardOpen: {
    borderColor: '#53643B',
  },
  statusIcon: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    backgroundColor: '#352326',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  statusIconOpen: {
    backgroundColor: '#293923',
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
  statusControl: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    gap: spacing.xs,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  openBadge: {
    backgroundColor: '#293923',
  },
  closedBadge: {
    backgroundColor: '#352326',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: radius.round,
    marginRight: 5,
  },
  openDot: {
    backgroundColor: colors.secondary,
  },
  closedDot: {
    backgroundColor: colors.danger,
  },
  activeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  openText: {
    color: colors.secondary,
  },
  closedText: {
    color: colors.danger,
  },
  statusUpdating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  statusUpdatingText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: colors.textLight,
    fontSize: 11,
    marginTop: 5,
  },
  sectionAccent: {
    width: 27,
    height: 4,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
  restaurantCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  infoRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: '#39291F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoIconLime: {
    backgroundColor: '#293923',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  infoSecondary: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flexBasis: '46%',
    flexGrow: 1,
    minWidth: 130,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    overflow: 'hidden',
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statIcon: {
    width: 39,
    height: 39,
    borderRadius: radius.md,
    backgroundColor: '#39291F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconLime: {
    backgroundColor: '#293923',
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },
  statAccent: {
    height: 3,
    width: 30,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    marginTop: spacing.md,
  },
  statAccentLime: {
    backgroundColor: colors.secondary,
  },
  managementCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  managementRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  managementIcon: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    backgroundColor: '#39291F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  limeIcon: {
    backgroundColor: '#293923',
  },
  managementContent: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  managementTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  managementText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  chevronCircle: {
    width: 29,
    height: 29,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowPressed: {
    backgroundColor: colors.surfaceAlt,
    opacity: 0.85,
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  accountRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  accountIcon: {
    width: 39,
    height: 39,
    borderRadius: radius.md,
    backgroundColor: '#39291F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountIconLime: {
    backgroundColor: '#293923',
  },
  accountContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  accountLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  accountValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  logoutButton: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '900',
  },
  logoutSpacer: {
    flex: 1,
  },
  footerText: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  buttonPressed: {
    opacity: 0.75,
  },
});
