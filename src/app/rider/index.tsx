import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';

type RiderData = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  address?: string;
  city?: string;
  area?: string;
  profilePhoto?: string;
  role?: string;
  status?: string;
};

type RiderProfile = {
  vehicleType?: 'BIKE' | 'CYCLE';
  vehicleNumber?: string;
  vehiclePhoto?: string;
  drivingLicenseNumber?: string;
  city?: string;
  area?: string;
  isAvailable?: boolean;
  isOnline?: boolean;
  totalDeliveries?: number;
  completedDeliveries?: number;
  cancelledDeliveries?: number;
  rating?: number;
  totalRatings?: number;
  isActive?: boolean;
};

export default function RiderDashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [rider, setRider] = useState<RiderData | null>(null);
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await api.get('/rider/dashboard');
      const data = response.data;

      if (!data?.success) {
        throw new Error(
          data?.message || 'Failed to load rider dashboard.'
        );
      }

      setRider(data.rider || null);
      setProfile(data.profile || null);
      setIsOnline(Boolean(data.profile?.isOnline));
    } catch (error: any) {
      console.error(
        'Load rider dashboard error:',
        error?.response?.status,
        error?.response?.data,
        error
      );

      Toast.show({
        type: 'error',
        text1: 'Dashboard Error',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to load rider dashboard.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleOnlineStatus = async () => {
    if (updatingStatus) {
      return;
    }

    const nextStatus = !isOnline;

    try {
      setUpdatingStatus(true);

      const response = await api.patch('/rider/online-status', {
        isOnline: nextStatus,
      });

      const data = response.data;

      if (!data?.success) {
        throw new Error(
          data?.message || 'Failed to update online status.'
        );
      }

      setIsOnline(Boolean(data.isOnline));

      setProfile((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          isOnline: Boolean(data.isOnline),
          isAvailable: Boolean(data.isAvailable),
        };
      });

      Toast.show({
        type: 'success',
        text1: nextStatus
          ? 'You are now online'
          : 'You are now offline',
        text2: nextStatus
          ? 'You can receive delivery requests.'
          : 'You will not receive new delivery requests.',
      });
    } catch (error: any) {
      console.error('Update rider online status error:', error);

      Toast.show({
        type: 'error',
        text1: 'Unable to update status',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Please try again.',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const openAvailableOrders = () => {
    router.push('/rider/available-orders');
  };

  const openMyOrders = () => {
    router.push('/rider/my-orders');
  };

  const riderName = rider?.name || user?.name || 'Rider';
  const riderEmail = rider?.email || user?.email || '—';
  const riderPhone = rider?.phone || user?.phone || '—';

  const totalDeliveries = profile?.totalDeliveries || 0;
  const completedDeliveries = profile?.completedDeliveries || 0;
  const rating =
    typeof profile?.rating === 'number' ? profile.rating : 0;
  const totalRatings = profile?.totalRatings || 0;
  const vehicleType =
    profile?.vehicleType === 'CYCLE' ? 'Cycle' : 'Bike';
  const vehicleNumber = profile?.vehicleNumber || '—';

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons
              name="bicycle"
              size={34}
              color={colors.primary}
            />
          </View>

          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingTitle}>
            Loading your dashboard
          </Text>

          <Text style={styles.loadingText}>
            Getting your rider information ready...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrow}>RIDER DASHBOARD</Text>
            </View>

            <Text style={styles.title}>Welcome back,</Text>

            <Text style={styles.name} numberOfLines={1}>
              {riderName}
            </Text>
          </View>

          <View style={styles.avatar}>
            <Ionicons
              name="person"
              size={27}
              color={colors.primary}
            />
          </View>
        </View>

        <View style={styles.onlineCard}>
          <View style={styles.onlineInfo}>
            <View
              style={[
                styles.onlineIcon,
                isOnline
                  ? styles.onlineIconActive
                  : styles.onlineIconInactive,
              ]}
            >
              <Ionicons
                name={isOnline ? 'radio' : 'radio-outline'}
                size={22}
                color={isOnline ? colors.secondary : colors.textSecondary}
              />
            </View>

            <View style={styles.onlineTextBlock}>
              <View style={styles.onlineTitleRow}>
                <Text style={styles.onlineTitle}>
                  {isOnline ? 'You are Online' : 'You are Offline'}
                </Text>

                <View
                  style={[
                    styles.onlineDot,
                    {
                      backgroundColor: isOnline
                        ? colors.secondary
                        : colors.textLight,
                    },
                  ]}
                />
              </View>

              <Text style={styles.onlineSubtitle}>
                {isOnline
                  ? 'Ready to receive delivery requests.'
                  : 'Go online to receive new orders.'}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.onlineButton,
              isOnline && styles.onlineButtonActive,
              updatingStatus && styles.disabledButton,
              pressed && !updatingStatus && styles.pressed,
            ]}
            onPress={handleOnlineStatus}
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <ActivityIndicator
                size="small"
                color={isOnline ? colors.black : colors.primary}
              />
            ) : (
              <Text
                style={[
                  styles.onlineButtonText,
                  isOnline && styles.onlineButtonTextActive,
                ]}
              >
                {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.earningsCard}>
          <View style={styles.earningsContent}>
            <View style={styles.earningsLabelRow}>
              <Ionicons
                name="wallet-outline"
                size={15}
                color={colors.secondary}
              />
              <Text style={styles.cardLabel}>TODAY'S EARNINGS</Text>
            </View>

            <Text style={styles.earnings}>Rs. 0</Text>

            <Text style={styles.earningsSubtext}>
              Earnings will update as deliveries are completed.
            </Text>

            <View style={styles.earningsFootnote}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.earningsFootnoteText}>
                Earnings data is not currently available.
              </Text>
            </View>
          </View>

          <View style={styles.earningsIcon}>
            <Ionicons
              name="wallet"
              size={29}
              color={colors.secondary}
            />
          </View>
          <View style={styles.earningsDecoration} />
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Your Overview</Text>
            <Text style={styles.sectionSubtitle}>
              Your delivery activity at a glance
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, styles.statIconOrange]}>
              <Ionicons
                name="bicycle-outline"
                size={20}
                color={colors.primary}
              />
            </View>

            <Text style={styles.statValue}>
              {completedDeliveries}
            </Text>

            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, styles.statIconLime]}>
              <Ionicons
                name="radio-outline"
                size={20}
                color={colors.secondary}
              />
            </View>

            <Text
              style={[
                styles.statValue,
                isOnline && styles.onlineStatValue,
              ]}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Text>

            <Text style={styles.statLabel}>Availability</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, styles.statIconHoney]}>
              <Ionicons
                name="star-outline"
                size={20}
                color={colors.honey}
              />
            </View>

            <Text style={styles.statValue}>
              {totalRatings > 0 ? rating.toFixed(1) : '—'}
            </Text>

            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View style={styles.headingTextGroup}>
            <Text style={styles.sectionTitle}>Delivery Requests</Text>
            <Text style={styles.sectionSubtitle}>
              Find orders waiting for a rider
            </Text>
          </View>

          <View style={styles.requestBadge}>
            <View style={styles.requestBadgeDot} />
            <Text style={styles.requestBadgeText}>ORDERS</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.deliveryButton,
            pressed && styles.pressed,
          ]}
          onPress={openAvailableOrders}
        >
          <View style={styles.deliveryButtonIcon}>
            <Ionicons
              name="bicycle"
              size={25}
              color={colors.primary}
            />
          </View>

          <View style={styles.deliveryButtonContent}>
            <Text style={styles.deliveryButtonTitle}>
              Available Deliveries
            </Text>

            <Text style={styles.deliveryButtonSubtitle}>
              Find and accept available orders
            </Text>
          </View>

          <View style={styles.chevronCircle}>
            <Ionicons
              name="arrow-forward"
              size={17}
              color={colors.text}
            />
          </View>
        </Pressable>

        <View style={styles.emptyCard}>
          <View style={styles.emptyDecoration} />

          <View style={styles.emptyIcon}>
            <Ionicons
              name="bicycle-outline"
              size={34}
              color={colors.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>
            No delivery requests
          </Text>

          <Text style={styles.emptyText}>
            {isOnline
              ? 'You are online. Available orders will appear here when they become available.'
              : 'Go online to start receiving delivery requests from nearby restaurants.'}
          </Text>

          {!isOnline && (
            <Pressable
              style={({ pressed }) => [
                styles.emptyButton,
                updatingStatus && styles.disabledButton,
                pressed && !updatingStatus && styles.pressed,
              ]}
              onPress={handleOnlineStatus}
              disabled={updatingStatus}
            >
              {updatingStatus ? (
                <ActivityIndicator
                  size="small"
                  color={colors.black}
                />
              ) : (
                <>
                  <Ionicons
                    name="radio-outline"
                    size={18}
                    color={colors.black}
                  />
                  <Text style={styles.emptyButtonText}>
                    Go Online
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionSubtitle}>
              Get to the tools you need
            </Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              pressed && styles.pressed,
            ]}
            onPress={openMyOrders}
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name="receipt-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.actionCardHeading}>
              <Text style={styles.actionTitle}>My Deliveries</Text>
              <Ionicons
                name="arrow-up-forward-outline"
                size={15}
                color={colors.textLight}
              />
            </View>

            <Text style={styles.actionText}>
              View active and completed deliveries
            </Text>
          </Pressable>

          <View style={[styles.actionCard, styles.actionCardStatic]}>
            <View style={[styles.actionIcon, styles.feedbackIcon]}>
              <Ionicons
                name="star-outline"
                size={23}
                color={colors.secondary}
              />
            </View>

            <Text style={styles.actionTitle}>Feedback</Text>

            <Text style={styles.actionText}>
              {totalRatings > 0
                ? `${totalRatings} customer ratings received`
                : 'Customer ratings will appear here'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Rider Information</Text>
            <Text style={styles.sectionSubtitle}>
              Your registered account and vehicle details
            </Text>
          </View>
        </View>

        <View style={styles.accountCard}>
          <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>FULL NAME</Text>
              <Text style={styles.accountValue} numberOfLines={1}>
                {riderName}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>EMAIL ADDRESS</Text>
              <Text style={styles.accountValue} numberOfLines={2}>
                {riderEmail}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
              <Ionicons
                name="call-outline"
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>PHONE NUMBER</Text>
              <Text style={styles.accountValue}>
                {riderPhone}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
              <Ionicons
                name="bicycle-outline"
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>VEHICLE TYPE</Text>
              <Text style={styles.accountValue}>
                {vehicleType}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
              <Ionicons
                name="card-outline"
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>VEHICLE NUMBER</Text>
              <Text style={styles.accountValue}>
                {vehicleNumber}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
              <Ionicons
                name="location-outline"
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>SERVICE AREA</Text>
              <Text style={styles.accountValue} numberOfLines={2}>
                {profile?.area || rider?.area || '—'}
                {(profile?.city || rider?.city)
                  ? `, ${profile?.city || rider?.city}`
                  : ''}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
              <Ionicons
                name="stats-chart-outline"
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>
                TOTAL DELIVERIES
              </Text>
              <Text style={styles.accountValue}>
                {totalDeliveries}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.logoutHint}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={colors.textLight}
          />
          <Text style={styles.logoutHintText}>
            Remember to go offline before ending your shift.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutPressed,
          ]}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={21}
            color={colors.danger}
          />

          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={styles.footerText}>
          FOODDASH · RIDER PORTAL
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

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },

  loadingIcon: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  loadingTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.lg,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  title: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },

  name: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 2,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  onlineCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  onlineInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: spacing.sm,
  },

  onlineIcon: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  onlineIconActive: {
    backgroundColor: '#29351F',
  },

  onlineIconInactive: {
    backgroundColor: colors.surfaceAlt,
  },

  onlineTextBlock: {
    flex: 1,
    minWidth: 0,
  },

  onlineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  onlineTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  onlineSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  onlineButton: {
    minWidth: 91,
    minHeight: 40,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  onlineButtonActive: {
    backgroundColor: colors.secondary,
  },

  onlineButtonText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  onlineButtonTextActive: {
    color: colors.black,
  },

  disabledButton: {
    opacity: 0.6,
  },

  earningsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    marginBottom: spacing.xxl,
  },

  earningsContent: {
    flex: 1,
    zIndex: 1,
  },

  earningsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  cardLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  earnings: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: spacing.sm,
  },

  earningsSubtext: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.xs,
    maxWidth: 240,
  },

  earningsFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.md,
  },

  earningsFootnoteText: {
    flex: 1,
    color: colors.textLight,
    fontSize: 9,
    lineHeight: 14,
  },

  earningsIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },

  earningsDecoration: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: colors.border,
    right: -48,
    top: -48,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },

  statCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },

  statIcon: {
    width: 37,
    height: 37,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  statIconOrange: {
    backgroundColor: '#38251D',
  },

  statIconLime: {
    backgroundColor: '#29351F',
  },

  statIconHoney: {
    backgroundColor: '#352C1E',
  },

  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  onlineStatValue: {
    color: colors.secondary,
    fontSize: 16,
  },

  statLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },

  headingTextGroup: {
    flex: 1,
  },

  requestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  requestBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },

  requestBadgeText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  deliveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },

  deliveryButtonIcon: {
    width: 49,
    height: 49,
    borderRadius: radius.md,
    backgroundColor: '#38251D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deliveryButtonContent: {
    flex: 1,
    minWidth: 0,
  },

  deliveryButtonTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  deliveryButtonSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  chevronCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCard: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: spacing.xxl,
  },

  emptyDecoration: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: colors.border,
    top: -75,
    right: -40,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    backgroundColor: '#38251D',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 290,
    marginTop: spacing.sm,
  },

  emptyButton: {
    minWidth: 130,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  emptyButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },

  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },

  actionCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },

  actionCardStatic: {
    opacity: 0.9,
  },

  actionIcon: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    backgroundColor: '#38251D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  feedbackIcon: {
    backgroundColor: '#29351F',
  },

  actionCardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },

  actionTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },

  actionText: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: spacing.sm,
  },

  accountCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },

  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },

  accountIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  accountInfo: {
    flex: 1,
    minWidth: 0,
  },

  accountLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginBottom: 4,
  },

  accountValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  logoutHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },

  logoutHintText: {
    color: colors.textLight,
    fontSize: 10,
    textAlign: 'center',
    flexShrink: 1,
  },

  logoutButton: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  logoutPressed: {
    opacity: 0.7,
  },

  logoutText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900',
  },

  pressed: {
    opacity: 0.75,
  },

  footerText: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
