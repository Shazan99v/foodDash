import React, {
  useCallback,
  useMemo,
  useRef,
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
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import {
  cancelCustomerOrder,
  getCustomerOrders,
} from '../services/customer/orderApi';
import { colors, radius, spacing } from '../constants/theme';

type OrderItem = {
  _id?: string;
  food?: string | { _id?: string; name?: string };
  name?: string;
  price?: number;
  quantity?: number;
  subtotal?: number;
};

type Order = {
  _id?: string;
  id?: string;
  orderNumber?: string | number;
  restaurant?: string | { _id?: string; name?: string };
  restaurantName?: string;
  items?: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  totalAmount?: number;
  total?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  orderStatus?: string;
  currentStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  delivery?: {
    name?: string;
    phone?: string;
    address?: string;
    label?: string;
  };
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  placed: { label: 'Order Placed', icon: 'receipt-outline' },
  received: { label: 'Order Received', icon: 'checkmark-circle-outline' },
  confirmed: { label: 'Confirmed', icon: 'checkmark-circle-outline' },
  accepted: { label: 'Accepted', icon: 'checkmark-circle-outline' },
  preparing: { label: 'Preparing', icon: 'restaurant-outline' },
  ready: { label: 'Ready for Pickup', icon: 'bag-check-outline' },
  ready_for_pickup: { label: 'Ready for Pickup', icon: 'bag-check-outline' },
  picked_up: { label: 'Picked Up', icon: 'bicycle-outline' },
  on_route: { label: 'On the Way', icon: 'bicycle-outline' },
  out_for_delivery: { label: 'On the Way', icon: 'bicycle-outline' },
  delivered: { label: 'Delivered', icon: 'checkmark-done-circle-outline' },
  cancelled: { label: 'Cancelled', icon: 'close-circle-outline' },
  rejected: { label: 'Rejected', icon: 'close-circle-outline' },
};

const normalizeStatus = (status?: string) =>
  String(status || 'PLACED')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const getOrderStatus = (order: Order) =>
  order.status || order.orderStatus || order.currentStatus || 'PLACED';

const formatStatus = (status?: string) => {
  const normalized = normalizeStatus(status);

  return (
    STATUS_CONFIG[normalized]?.label ||
    normalized.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
};

const getStatusIcon = (
  status?: string
): keyof typeof Ionicons.glyphMap =>
  STATUS_CONFIG[normalizeStatus(status)]?.icon || 'time-outline';

const isFinished = (status?: string) =>
  ['delivered', 'cancelled', 'rejected'].includes(normalizeStatus(status));

const canCancel = (status?: string) =>
  ['placed', 'received'].includes(normalizeStatus(status));

const formatPaymentMethod = (method?: string) => {
  const methods: Record<string, string> = {
    cod: 'Cash on Delivery',
    cash_on_delivery: 'Cash on Delivery',
    jazzcash: 'JazzCash',
    easypaisa: 'Easypaisa',
    card: 'Debit / Credit Card',
  };

  const key = String(method || '').trim().toLowerCase();

  return methods[key] || method || 'Not specified';
};

const formatPrice = (amount?: number) =>
  `Rs. ${Number(amount || 0).toLocaleString('en-PK', {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date?: string) => {
  if (!date) return 'Date unavailable';

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return 'Date unavailable';

  return value.toLocaleString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getOrderId = (order: Order) =>
  String(order._id || order.id || '');

const getRestaurantName = (order: Order) => {
  if (typeof order.restaurant === 'object' && order.restaurant?.name) {
    return order.restaurant.name;
  }

  return order.restaurantName || 'Restaurant';
};

const getOrderItems = (order: Order) =>
  Array.isArray(order.items) ? order.items : [];

const getOrderTotal = (order: Order) =>
  Number(order.totalAmount ?? order.total ?? 0);

const extractOrders = (response: any): Order[] => {
  const candidates = [
    response?.orders,
    response?.data?.orders,
    response?.data?.data?.orders,
    response?.data,
    response?.data?.data,
    response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && Array.isArray(candidate.orders)) return candidate.orders;
  }

  return [];
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const requestInProgress = useRef(false);
  const screenFocused = useRef(false);

  const loadOrders = useCallback(async (showLoader = false) => {
    if (requestInProgress.current) return;

    requestInProgress.current = true;

    if (showLoader) setLoading(true);

    try {
      setLoadError('');

      const response = await getCustomerOrders();
      const data = extractOrders(response);

      data.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setOrders(data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Please check your connection and try again.';

      setLoadError(message);

      Toast.show({
        type: 'error',
        text1: 'Unable to load orders',
        text2: message,
      });
    } finally {
      requestInProgress.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      screenFocused.current = true;
      void loadOrders(true);

      const interval = setInterval(() => {
        if (screenFocused.current) void loadOrders();
      }, 5000);

      return () => {
        screenFocused.current = false;
        clearInterval(interval);
      };
    }, [loadOrders])
  );

  const activeOrders = useMemo(
    () => orders.filter((order) => !isFinished(getOrderStatus(order))),
    [orders]
  );

  const pastOrders = useMemo(
    () => orders.filter((order) => isFinished(getOrderStatus(order))),
    [orders]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadOrders();
  }, [loadOrders]);

  const openOrder = (orderId: string) => {
    if (!orderId) {
      Toast.show({
        type: 'error',
        text1: 'Order ID missing',
        text2: 'This order cannot be opened because it has no ID.',
      });
      return;
    }

    router.push({
      pathname: '/orders/[id]',
      params: { id: orderId },
    });
  };

  const handleCancel = async (orderId: string) => {
    if (!orderId || cancellingId) return;

    setCancellingId(orderId);

    try {
      await cancelCustomerOrder(orderId);

      Toast.show({
        type: 'success',
        text1: 'Order cancelled',
        text2: 'The server confirmed the cancellation.',
      });

      await loadOrders();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Unable to cancel order',
        text2:
          error?.response?.data?.message ||
          'The order may no longer be cancellable.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const renderOrder = (order: Order) => {
    const orderId = getOrderId(order);
    const status = normalizeStatus(getOrderStatus(order));
    const finished = isFinished(status);
    const restaurantName = getRestaurantName(order);
    const items = getOrderItems(order);

    const itemPreview = items
      .slice(0, 3)
      .map((item) => {
        const name =
          item.name ||
          (typeof item.food === 'object' ? item.food?.name : '') ||
          'Food item';

        return `${Number(item.quantity || 1)}× ${name}`;
      })
      .join(' · ');

    const extraItems = Math.max(items.length - 3, 0);

    return (
      <View
        key={orderId || `${order.createdAt}-${restaurantName}`}
        style={styles.orderCard}
      >
        <View style={styles.orderHeader}>
          <View style={styles.restaurantIcon}>
            <Ionicons name="restaurant-outline" size={22} color={colors.primary} />
          </View>

          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName} numberOfLines={1}>
              {restaurantName}
            </Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>

            {order.orderNumber ? (
              <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
            ) : null}
          </View>

          <View style={styles.totalContainer}>
            <Text style={styles.totalCaption}>TOTAL</Text>
            <Text style={styles.orderTotal}>
              {formatPrice(getOrderTotal(order))}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.itemsRow}>
          <Ionicons name="fast-food-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.itemsText} numberOfLines={3}>
            {itemPreview || 'Order items'}
            {extraItems > 0 ? ` · +${extraItems} more` : ''}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={[styles.statusIconBox, finished && styles.statusIconBoxFinished]}>
            <Ionicons
              name={getStatusIcon(status)}
              size={20}
              color={finished ? colors.textSecondary : colors.secondary}
            />
          </View>

          <View style={styles.statusContent}>
            <Text style={styles.statusCaption}>ORDER STATUS</Text>
            <Text style={[styles.statusText, finished && styles.finishedStatusText]}>
              {formatStatus(status)}
            </Text>
          </View>

          {!finished ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>IN PROGRESS</Text>
            </View>
          ) : null}
        </View>

        {order.delivery?.address ? (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={17} color={colors.textSecondary} />
            <Text style={styles.addressText} numberOfLines={2}>
              {order.delivery.address}
            </Text>
          </View>
        ) : null}

        <View style={styles.footerMeta}>
          <View style={styles.paymentMeta}>
            <Ionicons name="wallet-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.paymentText}>
              {formatPaymentMethod(order.paymentMethod)}
            </Text>
          </View>

          {order.paymentStatus ? (
            <Text style={styles.paymentStatus}>
              {String(order.paymentStatus).replace(/_/g, ' ')}
            </Text>
          ) : null}
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.trackButton, pressed && styles.pressed]}
            onPress={() => openOrder(orderId)}
            accessibilityRole="button"
          >
            <Ionicons
              name={finished ? 'receipt-outline' : 'navigate-outline'}
              size={18}
              color={colors.black}
            />
            <Text style={styles.trackButtonText}>
              {finished ? 'View Order Details' : 'Track Order'}
            </Text>
            <Ionicons name="chevron-forward" size={17} color={colors.black} />
          </Pressable>

          {canCancel(status) ? (
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
                cancellingId === orderId && styles.disabledButton,
              ]}
              onPress={() => void handleCancel(orderId)}
              disabled={cancellingId !== null}
              accessibilityRole="button"
            >
              {cancellingId === orderId ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <View style={[styles.loadingScreen, { paddingTop: insets.top }]}>
        <View style={styles.loadingIcon}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <Text style={styles.loadingTitle}>Loading your orders</Text>
        <Text style={styles.loadingText}>
          Getting the latest order information from the server...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top + 10, 18) },
        ]}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
          <Text style={styles.title}>My Orders</Text>
          <Text style={styles.subtitle}>
            Track deliveries and revisit past orders.
          </Text>
        </View>

        <Pressable
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
          accessibilityRole="button"
          accessibilityLabel="Refresh orders"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh-outline" size={21} color={colors.primary} />
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 18) + 30 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.summaryBanner}>
          <View style={styles.summaryBannerText}>
            <Text style={styles.bannerEyebrow}>ORDER OVERVIEW</Text>
            <Text style={styles.bannerTitle}>
              {activeOrders.length > 0
                ? `${activeOrders.length} order${activeOrders.length === 1 ? '' : 's'} in progress`
                : 'All caught up'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {activeOrders.length > 0
                ? 'Open an order to check its latest status.'
                : 'Your recent orders and delivery history are below.'}
            </Text>
          </View>

          <View style={styles.bannerIcon}>
            <Ionicons name="receipt-outline" size={28} color={colors.primary} />
          </View>
        </View>

        {loadError && orders.length === 0 ? (
          <View style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Ionicons name="cloud-offline-outline" size={27} color={colors.primary} />
            </View>
            <Text style={styles.errorTitle}>Orders couldn't be loaded</Text>
            <Text style={styles.errorText}>{loadError}</Text>

            <Pressable
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
              onPress={() => void loadOrders(true)}
            >
              <Ionicons name="refresh-outline" size={17} color={colors.black} />
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={42} color={colors.secondary} />
            </View>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>
              When you place an order, its real status and order details will appear here.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.exploreButton, pressed && styles.pressed]}
              onPress={() => router.push('/explore')}
            >
              <Ionicons name="search-outline" size={18} color={colors.black} />
              <Text style={styles.exploreButtonText}>Explore Restaurants</Text>
            </Pressable>

            <Pressable
              style={styles.retryLink}
              onPress={() => void loadOrders(true)}
            >
              <Text style={styles.retryLinkText}>Refresh order history</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {loadError ? (
              <View style={styles.inlineWarning}>
                <Ionicons name="alert-circle-outline" size={17} color={colors.honey} />
                <Text style={styles.inlineWarningText}>
                  Refresh failed. Showing the last successfully loaded orders.
                </Text>
              </View>
            ) : null}

            {activeOrders.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeadingRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Active Orders</Text>
                    <Text style={styles.sectionSubtitle}>
                      Orders that haven't been completed
                    </Text>
                  </View>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{activeOrders.length}</Text>
                  </View>
                </View>
                {activeOrders.map(renderOrder)}
              </View>
            ) : null}

            {pastOrders.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeadingRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Order History</Text>
                    <Text style={styles.sectionSubtitle}>
                      Completed and cancelled orders
                    </Text>
                  </View>
                  <View style={styles.historyBadge}>
                    <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.historyBadgeText}>{pastOrders.length}</Text>
                  </View>
                </View>
                {pastOrders.map(renderOrder)}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingIcon: {
    width: 68,
    height: 68,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 18,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 9,
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
    fontSize: 10,
    marginTop: 4,
  },
  refreshButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: spacing.sm,
  },
  content: {
    padding: spacing.lg,
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  summaryBannerText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  bannerEyebrow: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  bannerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 7,
  },
  bannerSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  bannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 19,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: colors.secondary,
  },
  countBadgeText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '900',
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  historyBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  restaurantInfo: {
    flex: 1,
    marginRight: spacing.sm,
    minWidth: 0,
  },
  restaurantName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  orderDate: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 5,
  },
  orderNumber: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalCaption: {
    color: colors.textLight,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  orderTotal: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  itemsText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  statusIconBox: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  statusIconBoxFinished: {
    backgroundColor: colors.background,
  },
  statusContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  statusCaption: {
    color: colors.textLight,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  finishedStatusText: {
    color: colors.textSecondary,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#485B2C',
    backgroundColor: '#252D1C',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  liveBadgeText: {
    color: colors.secondary,
    fontSize: 7,
    fontWeight: '900',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: spacing.md,
  },
  addressText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
  },
  footerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.md,
  },
  paymentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentText: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  paymentStatus: {
    color: colors.textLight,
    fontSize: 9,
    textTransform: 'capitalize',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  trackButton: {
    minHeight: 46,
    flex: 1,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 10,
  },
  trackButtonText: {
    color: colors.black,
    fontSize: 11,
    fontWeight: '900',
    flex: 1,
    textAlign: 'center',
  },
  cancelButton: {
    minHeight: 46,
    minWidth: 72,
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.75,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 29,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 310,
  },
  exploreButton: {
    marginTop: spacing.lg,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  exploreButtonText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '900',
  },
  retryLink: {
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  retryLinkText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  errorCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  errorIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  retryButton: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.secondary,
    marginTop: spacing.lg,
  },
  retryButtonText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '900',
  },
  inlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  inlineWarningText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
  },
});
