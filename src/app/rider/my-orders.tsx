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

import {
  deliverRiderOrder,
  getMyRiderOrders,
  pickupRiderOrder,
} from '../../services/rider/riderOrderApi';

import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';

type OrderStatus =
  | 'READY'
  | 'ON_ROUTE'
  | 'DELIVERED'
  | 'CANCELLED'
  | string;

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  total: number;
};

type Restaurant = {
  name?: string;
  address?: string;
  city?: string;
  area?: string;
};

type Customer = {
  name?: string;
  phone?: string;
};

type Order = {
  _id: string;
  status: OrderStatus;
  items?: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryArea?: string;
  restaurant?: Restaurant;
  customer?: Customer;
  riderAcceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt?: string;
};

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case 'READY':
      return 'READY FOR PICKUP';
    case 'ON_ROUTE':
      return 'ON ROUTE';
    case 'DELIVERED':
      return 'DELIVERED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return status;
  }
};

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'READY':
      return colors.primary;
    case 'ON_ROUTE':
      return colors.honey;
    case 'DELIVERED':
      return colors.success;
    case 'CANCELLED':
      return colors.danger;
    default:
      return colors.textSecondary;
  }
};

const formatDate = (date?: string) => {
  if (!date) {
    return 'N/A';
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'N/A';
  }

  return parsedDate.toLocaleString();
};

const formatAmount = (amount?: number) =>
  `Rs. ${Number(amount ?? 0).toLocaleString()}`;

export default function RiderMyOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(
    null
  );

  const loadOrders = useCallback(async () => {
    try {
      const response = await getMyRiderOrders();

      if (!response?.success) {
        throw new Error(
          response?.message || 'Failed to load deliveries.'
        );
      }

      setOrders(
        Array.isArray(response.orders) ? response.orders : []
      );
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load deliveries',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Please try again.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handlePickup = async (orderId: string) => {
    try {
      setActionLoading(orderId);

      const response = await pickupRiderOrder(orderId);

      if (!response?.success) {
        throw new Error(
          response?.message || 'Failed to pick up order.'
        );
      }

      Toast.show({
        type: 'success',
        text1: 'Order Picked Up',
        text2: 'Delivery is now on route.',
      });

      await loadOrders();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Pickup Failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Please try again.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async (orderId: string) => {
    try {
      setActionLoading(orderId);

      const response = await deliverRiderOrder(orderId);

      if (!response?.success) {
        throw new Error(
          response?.message || 'Failed to complete delivery.'
        );
      }

      Toast.show({
        type: 'success',
        text1: 'Delivery Completed',
        text2: 'Order has been marked as delivered.',
      });

      await loadOrders();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Delivery Failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Please try again.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const activeOrders = orders.filter(
    (order) =>
      order.status === 'READY' || order.status === 'ON_ROUTE'
  );

  const historyOrders = orders.filter(
    (order) =>
      order.status === 'DELIVERED' ||
      order.status === 'CANCELLED'
  );

  const completedCount = orders.filter(
    (order) => order.status === 'DELIVERED'
  ).length;

  const renderOrder = (order: Order, isHistory = false) => {
    const statusColor = getStatusColor(order.status);
    const isActionLoading = actionLoading === order._id;

    const customerName =
      order.customerName || order.customer?.name || 'Customer';

    const customerPhone =
      order.customerPhone || order.customer?.phone;

    const locationDetails = [
      order.deliveryArea,
      order.deliveryCity,
    ]
      .filter(Boolean)
      .join(', ');

    return (
      <View key={order._id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderNumberBox}>
            <Text style={styles.orderNumberLabel}>
              ORDER REFERENCE
            </Text>
            <Text style={styles.orderNumber}>
              #{order._id.slice(-6).toUpperCase()}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { borderColor: statusColor },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColor },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: statusColor },
              ]}
            >
              {getStatusLabel(order.status)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <Ionicons
              name="restaurant-outline"
              size={19}
              color={colors.primary}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>RESTAURANT</Text>
            <Text style={styles.infoValue}>
              {order.restaurant?.name || 'Restaurant'}
            </Text>

            {!!order.restaurant?.address && (
              <Text style={styles.infoMuted}>
                {order.restaurant.address}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <Ionicons
              name="person-outline"
              size={19}
              color={colors.primary}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>CUSTOMER</Text>
            <Text style={styles.infoValue}>{customerName}</Text>

            {!!customerPhone && (
              <Text style={styles.infoMuted}>
                {customerPhone}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <Ionicons
              name="location-outline"
              size={19}
              color={colors.primary}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>
              DELIVERY ADDRESS
            </Text>
            <Text style={styles.infoValue}>
              {order.deliveryAddress || 'Address not available'}
            </Text>

            {!!locationDetails && (
              <Text style={styles.infoMuted}>
                {locationDetails}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.itemsBox}>
          <View style={styles.itemsHeading}>
            <Text style={styles.sectionLabel}>ORDER ITEMS</Text>
            <Text style={styles.itemsCount}>
              {(order.items || []).length}{' '}
              {(order.items || []).length === 1 ? 'item' : 'items'}
            </Text>
          </View>

          {(order.items || []).length === 0 ? (
            <Text style={styles.noItemsText}>
              Item details unavailable
            </Text>
          ) : (
            (order.items || []).map((item, index) => (
              <View
                key={`${order._id}-${index}`}
                style={styles.itemRow}
              >
                <Text style={styles.itemName} numberOfLines={2}>
                  <Text style={styles.itemQuantity}>
                    {item.quantity} ×{' '}
                  </Text>
                  {item.name}
                </Text>

                <Text style={styles.itemPrice}>
                  {formatAmount(item.total)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.paymentRow}>
          <View>
            <Text style={styles.infoLabel}>PAYMENT METHOD</Text>
            <Text style={styles.paymentMethod}>
              {order.paymentMethod || 'N/A'}
            </Text>

            {!!order.paymentStatus && (
              <Text style={styles.paymentStatus}>
                {order.paymentStatus.replace(/_/g, ' ')}
              </Text>
            )}
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.infoLabel}>ORDER TOTAL</Text>
            <Text style={styles.totalAmount}>
              {formatAmount(order.totalAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <Ionicons
            name="time-outline"
            size={15}
            color={colors.textLight}
          />
          <Text style={styles.dateText}>
            Placed {formatDate(order.createdAt)}
          </Text>
        </View>

        {!isHistory && order.status === 'READY' && (
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && !isActionLoading && styles.buttonPressed,
              isActionLoading && styles.disabledButton,
            ]}
            onPress={() => handlePickup(order._id)}
            disabled={isActionLoading}
          >
            {isActionLoading ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <>
                <Ionicons
                  name="bag-check-outline"
                  size={20}
                  color={colors.black}
                />
                <Text style={styles.actionButtonText}>
                  Pick Up Order
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={17}
                  color={colors.black}
                />
              </>
            )}
          </Pressable>
        )}

        {!isHistory && order.status === 'ON_ROUTE' && (
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && !isActionLoading && styles.buttonPressed,
              isActionLoading && styles.disabledButton,
            ]}
            onPress={() => handleDeliver(order._id)}
            disabled={isActionLoading}
          >
            {isActionLoading ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={colors.black}
                />
                <Text style={styles.actionButtonText}>
                  Mark Delivered
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={17}
                  color={colors.black}
                />
              </>
            )}
          </Pressable>
        )}

        {order.status === 'DELIVERED' && (
          <View style={styles.completedBox}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
            <Text style={styles.completedText}>
              Delivered successfully
            </Text>
          </View>
        )}

        {order.status === 'CANCELLED' && (
          <View style={styles.cancelledBox}>
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.danger}
            />
            <Text style={styles.cancelledText}>
              Delivery cancelled
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />
          </View>
          <Text style={styles.loadingText}>
            Loading deliveries...
          </Text>
          <Text style={styles.loadingSubtext}>
            Getting your assigned orders ready
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.headerIconButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.text}
          />
        </Pressable>

        <View style={styles.headerTextBox}>
          <Text style={styles.eyebrow}>RIDER DASHBOARD</Text>
          <Text style={styles.headerTitle}>My Deliveries</Text>
          <Text style={styles.headerSubtitle}>
            Your orders, your route.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.headerIconButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleRefresh}
          disabled={refreshing}
          accessibilityRole="button"
          accessibilityLabel="Refresh deliveries"
        >
          {refreshing ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />
          ) : (
            <Ionicons
              name="refresh"
              size={20}
              color={colors.primary}
            />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeBanner}>
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.welcomeBadgeText}>
                DELIVERY OVERVIEW
              </Text>
            </View>

            <Text style={styles.welcomeTitle}>
              Keep things{'\n'}moving.
            </Text>

            <Text style={styles.welcomeDescription}>
              Manage pickups and complete deliveries right here.
            </Text>
          </View>

          <View style={styles.welcomeIllustration}>
            <Ionicons
              name="bicycle"
              size={51}
              color={colors.secondary}
            />
            <View style={styles.illustrationAccent} />
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryHeading}>
            <Text style={styles.summaryTitle}>Your activity</Text>
            <Text style={styles.summaryCaption}>
              All assigned orders
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryIcon,
                  styles.activeSummaryIcon,
                ]}
              >
                <Ionicons
                  name="bicycle-outline"
                  size={19}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.summaryNumber}>
                {activeOrders.length}
              </Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>

            <View style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryIcon,
                  styles.completedSummaryIcon,
                ]}
              >
                <Ionicons
                  name="checkmark-done-outline"
                  size={19}
                  color={colors.success}
                />
              </View>

              <Text style={styles.summaryNumber}>
                {completedCount}
              </Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>

            <View style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryIcon,
                  styles.totalSummaryIcon,
                ]}
              >
                <Ionicons
                  name="receipt-outline"
                  size={19}
                  color={colors.honey}
                />
              </View>

              <Text style={styles.summaryNumber}>
                {orders.length}
              </Text>
              <Text style={styles.summaryLabel}>Total orders</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleGroup}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>
                Active Deliveries
              </Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Orders currently assigned to you
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {activeOrders.length}
            </Text>
          </View>
        </View>

        {activeOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="bicycle-outline"
                size={33}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              All caught up!
            </Text>
            <Text style={styles.emptyText}>
              Accepted deliveries will appear here when they are
              assigned to you.
            </Text>
          </View>
        ) : (
          activeOrders.map((order) => renderOrder(order))
        )}

        <View style={[styles.sectionHeader, styles.historyHeader]}>
          <View style={styles.sectionTitleGroup}>
            <View style={styles.sectionTitleRow}>
              <View
                style={[
                  styles.sectionAccent,
                  styles.historyAccent,
                ]}
              />
              <Text style={styles.sectionTitle}>
                Delivery History
              </Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Completed and cancelled deliveries
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {historyOrders.length}
            </Text>
          </View>
        </View>

        {historyOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="time-outline"
                size={31}
                color={colors.textSecondary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No delivery history yet
            </Text>
            <Text style={styles.emptyText}>
              Your completed deliveries will be listed here.
            </Text>
          </View>
        ) : (
          historyOrders.map((order) => renderOrder(order, true))
        )}

        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={15}
            color={colors.textLight}
          />
          <Text style={styles.footerText}>
            Keep customer and delivery details accurate.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },

  headerIconButton: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTextBox: {
    flex: 1,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 3,
  },

  headerTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.7,
  },

  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  welcomeBanner: {
    minHeight: 183,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },

  welcomeContent: {
    flex: 1,
    zIndex: 1,
  },

  welcomeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.round,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginBottom: spacing.md,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },

  welcomeBadgeText: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  welcomeTitle: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: -1,
  },

  welcomeDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
    maxWidth: 230,
  },

  welcomeIllustration: {
    width: 77,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },

  illustrationAccent: {
    width: 49,
    height: 4,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },

  summarySection: {
    marginBottom: spacing.xxl,
  },

  summaryHeading: {
    marginBottom: spacing.md,
  },

  summaryTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },

  summaryCaption: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  summaryCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },

  summaryIcon: {
    width: 37,
    height: 37,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  activeSummaryIcon: {
    backgroundColor: '#38251D',
  },

  completedSummaryIcon: {
    backgroundColor: '#26351E',
  },

  totalSummaryIcon: {
    backgroundColor: '#352C1E',
  },

  summaryNumber: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },

  sectionTitleGroup: {
    flex: 1,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  sectionAccent: {
    width: 4,
    height: 21,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },

  historyAccent: {
    backgroundColor: colors.secondary,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 5,
    marginLeft: 12,
  },

  countBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },

  orderCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  orderNumberBox: {
    flex: 1,
    minWidth: 0,
  },

  orderNumberLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },

  orderNumber: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginTop: 4,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.round,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    flexShrink: 0,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },

  infoIconBox: {
    width: 37,
    height: 37,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
    paddingTop: 2,
  },

  infoLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 4,
  },

  infoMuted: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

  itemsBox: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.xs,
  },

  itemsHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  itemsCount: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '600',
  },

  noItemsText: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },

  itemName: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
  },

  itemQuantity: {
    color: colors.secondary,
    fontWeight: '900',
  },

  itemPrice: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },

  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  paymentMethod: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 5,
  },

  paymentStatus: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },

  totalBox: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },

  totalAmount: {
    color: colors.secondary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 4,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: 6,
  },

  dateText: {
    flex: 1,
    color: colors.textLight,
    fontSize: 10,
    lineHeight: 15,
  },

  actionButton: {
    minHeight: 51,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },

  buttonPressed: {
    opacity: 0.78,
  },

  disabledButton: {
    opacity: 0.6,
  },

  actionButtonText: {
    flex: 1,
    color: colors.black,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },

  completedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25341F',
    borderWidth: 1,
    borderColor: '#40502B',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },

  completedText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '800',
  },

  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#351F22',
    borderWidth: 1,
    borderColor: '#593034',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },

  cancelledText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    maxWidth: 290,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  historyHeader: {
    marginTop: spacing.xxl,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  footerText: {
    color: colors.textLight,
    fontSize: 10,
    textAlign: 'center',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },

  loadingIcon: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: spacing.lg,
  },

  loadingSubtext: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
