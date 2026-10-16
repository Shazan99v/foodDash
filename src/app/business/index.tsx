import React, { useCallback, useEffect, useState } from 'react';
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [loadError, setLoadError] = useState('');

  const loadRestaurant = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const result = await getMyRestaurant();
      setRestaurant(result);
    } catch (error: any) {
      setLoadError(
        error?.response?.data?.message ||
          error?.message ||
          'Could not load your restaurant. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRestaurant();
  }, [loadRestaurant]);

  const handleRestaurantStatusChange = async (
    nextIsOpen: boolean
  ) => {
    if (!restaurant || isSavingStatus || !restaurant.isActive) {
      return;
    }

    const previousRestaurant = restaurant;

    setIsSavingStatus(true);
    setStatusError('');

    setRestaurant({
      ...previousRestaurant,
      isOpen: nextIsOpen,
    });

    try {
      const updatedRestaurant =
        await updateRestaurantStatus(nextIsOpen);

      setRestaurant(updatedRestaurant);
    } catch (error: any) {
      setRestaurant(previousRestaurant);

      setStatusError(
        error?.response?.data?.message ||
          error?.message ||
          'Could not update restaurant availability. Please try again.'
      );
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const openOrders = () => router.push('/business/orders');
  const openCategories = () => router.push('/business/categories');
  const openMenuItems = () => router.push('/business/menu-items');

  const isRestaurantOpen = restaurant?.isOpen === true;
  const isRestaurantActive = restaurant?.isActive === true;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrow}>BUSINESS ACCOUNT</Text>
            </View>

            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.name}>
              {user?.name || 'Business Owner'}
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

        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIcon,
              !isRestaurantActive && styles.statusIconInactive,
            ]}
          >
            <Ionicons
              name={isRestaurantActive ? 'checkmark-circle' : 'alert-circle'}
              size={25}
              color={isRestaurantActive ? colors.secondary : colors.danger}
            />
          </View>

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              {isLoading
                ? 'Checking restaurant status'
                : isRestaurantActive
                  ? 'Restaurant Approved'
                  : restaurant
                    ? 'Restaurant Inactive'
                    : 'Restaurant Status'}
            </Text>

            <Text style={styles.statusText}>
              {isLoading
                ? 'Loading your restaurant information...'
                : isRestaurantActive
                  ? 'Your restaurant is approved. Manage its availability below.'
                  : restaurant
                    ? 'Your restaurant is not currently active. Contact the administrator if this is unexpected.'
                    : loadError
                      ? 'Your restaurant information could not be loaded.'
                      : 'Restaurant information is unavailable.'}
            </Text>
          </View>

          <View
            style={[
              styles.activeBadge,
              !isRestaurantActive && styles.inactiveBadge,
            ]}
          >
            <View
              style={[
                styles.activeDot,
                !isRestaurantActive && styles.inactiveDot,
              ]}
            />
            <Text
              style={[
                styles.activeText,
                !isRestaurantActive && styles.inactiveText,
              ]}
            >
              {isLoading
                ? '...'
                : isRestaurantActive
                  ? 'ACTIVE'
                  : 'INACTIVE'}
            </Text>
          </View>
        </View>

        <View style={styles.availabilityCard}>
          <View style={styles.cardEyebrowRow}>
            <Text style={styles.cardEyebrow}>STORE SETTINGS</Text>
            <Ionicons
              name="settings-outline"
              size={15}
              color={colors.textLight}
            />
          </View>

          <View style={styles.availabilityHeader}>
            <View
              style={[
                styles.availabilityIcon,
                isRestaurantOpen && styles.availabilityIconOpen,
              ]}
            >
              <Ionicons
                name={
                  isRestaurantOpen
                    ? 'storefront'
                    : 'storefront-outline'
                }
                size={25}
                color={
                  isRestaurantOpen
                    ? colors.secondary
                    : colors.textSecondary
                }
              />
            </View>

            <View style={styles.availabilityHeading}>
              <Text style={styles.availabilityTitle}>
                Restaurant Availability
              </Text>
              <Text style={styles.availabilityDescription}>
                Control whether customers can place orders.
              </Text>
            </View>
          </View>

          <View style={styles.availabilityDivider} />

          <View style={styles.availabilityControl}>
            <View style={styles.availabilityStatus}>
              {isLoading ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                  />
                  <Text style={styles.availabilityState}>
                    Loading status...
                  </Text>
                </>
              ) : (
                <>
                  <View
                    style={[
                      styles.availabilityDot,
                      isRestaurantOpen
                        ? styles.openDot
                        : styles.closedDot,
                    ]}
                  />

                  <Text
                    style={[
                      styles.availabilityState,
                      {
                        color: isRestaurantOpen
                          ? colors.secondary
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {isRestaurantOpen ? 'OPEN FOR ORDERS' : 'CURRENTLY CLOSED'}
                  </Text>

                  {isSavingStatus && (
                    <ActivityIndicator
                      size="small"
                      color={colors.primary}
                      style={styles.savingIndicator}
                    />
                  )}
                </>
              )}
            </View>

            <Switch
              value={isRestaurantOpen}
              onValueChange={handleRestaurantStatusChange}
              disabled={
                isLoading ||
                isSavingStatus ||
                !restaurant ||
                !isRestaurantActive
              }
              trackColor={{
                false: colors.border,
                true: colors.primary,
              }}
              thumbColor={
                isRestaurantOpen ? colors.white : colors.textSecondary
              }
              ios_backgroundColor={colors.border}
              accessibilityRole="switch"
              accessibilityLabel="Restaurant open or closed"
              accessibilityHint="Turn on to mark your restaurant open, or turn off to mark it closed."
            />
          </View>

          <Text style={styles.availabilityHint}>
            {isLoading
              ? 'Connecting to your restaurant account...'
              : !restaurant
                ? 'Load your restaurant information to manage availability.'
                : !isRestaurantActive
                  ? 'Availability cannot be changed while your restaurant is inactive.'
                  : isRestaurantOpen
                    ? 'Your restaurant is marked open. Customers may still be restricted by your operating hours.'
                    : 'Your restaurant is marked closed.'}
          </Text>

          {!!statusError && (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={19}
                color={colors.danger}
              />
              <Text style={styles.errorText}>{statusError}</Text>
            </View>
          )}

          {!!loadError && (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={19}
                color={colors.danger}
              />
              <Text style={styles.errorText}>{loadError}</Text>
            </View>
          )}

          {!!loadError && (
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.rowPressed,
              ]}
              onPress={() => void loadRestaurant()}
              disabled={isLoading}
              accessibilityRole="button"
            >
              <Ionicons
                name="refresh-outline"
                size={17}
                color={colors.primary}
              />
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Today at a glance</Text>
            <Text style={styles.sectionSubtitle}>
              Your daily business overview
            </Text>
          </View>
          <View style={styles.sectionAccent} />
        </View>

        <View style={styles.statsRow}>
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
                size={18}
                color={colors.textLight}
              />
            </View>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
            <View style={styles.statBottomAccent} />
          </View>

          <View style={styles.statCard}>
            <View style={styles.statTopRow}>
              <View style={[styles.statIcon, styles.statIconLime]}>
                <Ionicons
                  name="wallet-outline"
                  size={21}
                  color={colors.secondary}
                />
              </View>
              <Ionicons
                name="stats-chart-outline"
                size={17}
                color={colors.textLight}
              />
            </View>
            <Text style={styles.statValue}>Rs. 0</Text>
            <Text style={styles.statLabel}>Today's Sales</Text>
            <View style={[styles.statBottomAccent, styles.statBottomLime]} />
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Manage your restaurant</Text>
            <Text style={styles.sectionSubtitle}>
              Everything you need, in one place
            </Text>
          </View>
        </View>

        <View style={styles.managementCard}>
          <Pressable
            style={({ pressed }) => [
              styles.managementRow,
              pressed && styles.rowPressed,
            ]}
            onPress={openOrders}
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
            onPress={openCategories}
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
            onPress={openMenuItems}
            accessibilityRole="button"
          >
            <View style={[styles.managementIcon, styles.orangeIcon]}>
              <Ionicons
                name="fast-food-outline"
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Menu Items</Text>
              <Text style={styles.managementText}>
                Control which menu items customers can order
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
            <Text style={styles.sectionTitle}>Account details</Text>
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
            <View style={styles.accountIcon}>
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
            pressed && styles.rowPressed,
          ]}
          onPress={handleLogout}
          accessibilityRole="button"
        >
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerContent: {
    flex: 1,
    paddingRight: spacing.md,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },
  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    marginRight: 7,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.7,
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
    marginTop: 5,
  },
  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusIcon: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    backgroundColor: '#293923',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  statusIconInactive: {
    backgroundColor: '#3A2729',
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#293923',
    borderRadius: radius.round,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: radius.round,
    backgroundColor: colors.secondary,
    marginRight: 5,
  },
  activeText: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '900',
  },
  inactiveBadge: {
    backgroundColor: '#3A2729',
  },
  inactiveDot: {
    backgroundColor: colors.danger,
  },
  inactiveText: {
    color: colors.danger,
  },
  availabilityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.xs,
  },
  cardEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardEyebrow: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityIcon: {
    width: 49,
    height: 49,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  availabilityIconOpen: {
    backgroundColor: '#293923',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  availabilityHeading: {
    flex: 1,
  },
  availabilityTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 5,
  },
  availabilityDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  availabilityDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  availabilityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  availabilityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: radius.round,
    marginRight: spacing.sm,
  },
  openDot: {
    backgroundColor: colors.secondary,
  },
  closedDot: {
    backgroundColor: colors.textLight,
  },
  availabilityState: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    flexShrink: 1,
  },
  savingIndicator: {
    marginLeft: spacing.sm,
  },
  availabilityHint: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#352326',
    borderWidth: 1,
    borderColor: '#573238',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  retryButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
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
    width: 28,
    height: 4,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
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
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },
  statBottomAccent: {
    height: 3,
    width: 32,
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    marginTop: spacing.md,
  },
  statBottomLime: {
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
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  managementIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#39291F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  limeIcon: {
    backgroundColor: '#293923',
  },
  orangeIcon: {
    backgroundColor: '#39291F',
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  accountRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  accountIcon: {
    width: 39,
    height: 39,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  accountLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 5,
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
    letterSpacing: 1.6,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  rowPressed: {
    opacity: 0.7,
  },
});
