import React, {
  useCallback,
  useEffect,
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
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { getCustomerOrder } from '../../services/customer/orderApi';
import { colors, radius, spacing } from '../../constants/theme';

type AnyRecord = Record<string, any>;

type OrderItem = {
  _id?: string;
  food?: AnyRecord | string;
  menuItem?: AnyRecord | string;
  name?: string;
  quantity?: number;
  price?: number;
  unitPrice?: number;
  subtotal?: number;
  image?: string;
};

type Order = {
  _id: string;
  orderNumber?: string;
  restaurant?: AnyRecord | string;
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
  pickedUpAt?: string;
  deliveredAt?: string;
  delivery?: AnyRecord;
  deliveryAddress?: AnyRecord | string;
  address?: AnyRecord | string;
  rider?: AnyRecord | string;
  deliveryPerson?: AnyRecord | string;
  estimatedDeliveryTime?: string | number;
  cancellationReason?: string;
  notes?: string;
  customerNote?: string;
};

const REFRESH_INTERVAL = 10000;

const STATUS_STEPS = [
  {
    key: 'PLACED',
    title: 'Order placed',
    description: 'Your order has been received.',
    icon: 'receipt-outline',
  },
  {
    key: 'CONFIRMED',
    title: 'Restaurant confirmed',
    description: 'The restaurant is confirming your order.',
    icon: 'checkmark-circle-outline',
  },
  {
    key: 'PREPARING',
    title: 'Preparing your food',
    description: 'Your food is being prepared fresh.',
    icon: 'restaurant-outline',
  },
  {
    key: 'READY',
    title: 'Ready for pickup',
    description: 'Your order is ready for the rider.',
    icon: 'fast-food-outline',
  },
  {
    key: 'ON_THE_WAY',
    title: 'Picked up — on the way',
    description: 'The rider is delivering your order.',
    icon: 'bicycle-outline',
  },
  {
    key: 'DELIVERED',
    title: 'Delivered',
    description: 'Your order has arrived. Enjoy your meal!',
    icon: 'checkmark-done-circle-outline',
  },
] as const;

const STATUS_ALIASES: Record<string, string> = {
  PLACED: 'PLACED',
  PENDING: 'PLACED',
  RECEIVED: 'CONFIRMED',
  CONFIRMED: 'CONFIRMED',
  ACCEPTED: 'CONFIRMED',
  APPROVED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  IN_PREPARATION: 'PREPARING',
  COOKING: 'PREPARING',
  READY: 'READY',
  READY_FOR_PICKUP: 'READY',
  PICKED_UP: 'ON_THE_WAY',
  PICKEDUP: 'ON_THE_WAY',
  ON_ROUTE: 'ON_THE_WAY',
  ON_THE_WAY: 'ON_THE_WAY',
  OUT_FOR_DELIVERY: 'ON_THE_WAY',
  IN_TRANSIT: 'ON_THE_WAY',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  CANCELED: 'CANCELLED',
  REJECTED: 'CANCELLED',
  FAILED: 'CANCELLED',
};

const normalizeStatus = (status?: string) => {
  const value = String(status || 'PLACED')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  return STATUS_ALIASES[value] || value;
};

const getOrderStatus = (order?: Order | null) =>
  normalizeStatus(
    order?.status || order?.orderStatus || order?.currentStatus,
  );

const extractOrder = (response: any): Order | null => {
  const candidates = [
    response?.order,
    response?.data?.order,
    response?.data?.data?.order,
    response?.data?.data,
    response?.data,
    response,
  ];

  return (
    candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate === 'object' &&
        !Array.isArray(candidate) &&
        candidate._id &&
        (candidate.status ||
          candidate.orderStatus ||
          candidate.currentStatus),
    ) || null
  );
};

const formatStatus = (status?: string) => {
  const normalized = normalizeStatus(status);

  if (normalized === 'ON_THE_WAY') return 'On the way';
  if (normalized === 'CANCELLED') return 'Cancelled';

  return normalized
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getRestaurantName = (restaurant?: AnyRecord | string) => {
  if (typeof restaurant === 'string') return 'Restaurant';
  return restaurant?.name || restaurant?.restaurantName || 'Restaurant';
};

const getItemName = (item: OrderItem) => {
  if (item.name) return item.name;

  const food =
    item.food && typeof item.food === 'object'
      ? item.food
      : item.menuItem && typeof item.menuItem === 'object'
        ? item.menuItem
        : null;

  return food?.name || food?.title || 'Menu item';
};

const getItemPrice = (item: OrderItem) => {
  const price = Number(item.price ?? item.unitPrice ?? item.subtotal ?? 0);
  return Number.isFinite(price) ? price : 0;
};

const formatMoney = (value: unknown) => {
  const amount = Number(value ?? 0);

  return `Rs. ${(Number.isFinite(amount) ? amount : 0).toLocaleString(
    'en-PK',
    { maximumFractionDigits: 2 },
  )}`;
};

const formatDate = (value?: string) => {
  if (!value) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const getAddressText = (value: any): string => {
  if (!value) return 'No delivery address available';
  if (typeof value === 'string') return value;

  const parts = [
    value.address,
    value.street,
    value.area,
    value.city,
    value.landmark,
  ].filter(
    (part) => typeof part === 'string' && part.trim().length > 0,
  );

  if (parts.length) return [...new Set(parts)].join(', ');
  if (value.formattedAddress) return value.formattedAddress;
  if (value.fullAddress) return value.fullAddress;

  return 'No delivery address available';
};

const getDeliveryAddress = (order: Order) => {
  const delivery = order.delivery;

  return getAddressText(
    delivery?.address ||
      delivery?.deliveryAddress ||
      order.deliveryAddress ||
      order.address,
  );
};

const getProgressIndex = (status: string) =>
  STATUS_STEPS.findIndex((step) => step.key === status);

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const orderId = Array.isArray(id) ? id[0] : id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const orderRef = useRef<Order | null>(null);
  const requestInProgress = useRef(false);

  const loadOrder = useCallback(
    async (showLoader = false) => {
      if (!orderId) {
        setLoadError('The order ID is missing.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (requestInProgress.current) return;
      requestInProgress.current = true;

      if (showLoader) setLoading(true);

      try {
        const response = await getCustomerOrder(orderId);
        const fetchedOrder = extractOrder(response);

        if (!fetchedOrder) {
          throw new Error(
            'The order response did not contain an order status.',
          );
        }

        orderRef.current = fetchedOrder;
        setOrder(fetchedOrder);
        setLoadError('');
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Unable to load this order. Please try again.';

        setLoadError(message);

        if (!orderRef.current) {
          Toast.show({
            type: 'error',
            text1: 'Unable to load order',
            text2: message,
          });
        }
      } finally {
        requestInProgress.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId],
  );

  useEffect(() => {
    orderRef.current = null;
    setOrder(null);
    setLoadError('');
    setLoading(true);
    setRefreshing(false);

    loadOrder(true);

    const interval = setInterval(() => {
      loadOrder(false);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [loadOrder]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrder(false);
  }, [loadOrder]);

  const status = useMemo(() => getOrderStatus(order), [order]);
  const progressIndex = useMemo(
    () => getProgressIndex(status),
    [status],
  );

  const items = useMemo(
    () => (Array.isArray(order?.items) ? order.items : []),
    [order],
  );

  const restaurantName = useMemo(
    () => getRestaurantName(order?.restaurant),
    [order],
  );

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + Math.max(1, Number(item.quantity) || 1),
        0,
      ),
    [items],
  );

  const subtotal = Number(order?.subtotal ?? 0);
  const deliveryFee = Number(order?.deliveryFee ?? 0);
  const totalAmount = Number(
    order?.totalAmount ?? order?.total ?? subtotal + deliveryFee,
  );

  const isCancelled = status === 'CANCELLED';
  const isDelivered = status === 'DELIVERED';

  const rider =
    order?.rider && typeof order.rider === 'object'
      ? order.rider
      : order?.deliveryPerson &&
          typeof order.deliveryPerson === 'object'
        ? order.deliveryPerson
        : null;

  const riderName = rider?.name || rider?.fullName;
  const riderPhone = rider?.phone || rider?.phoneNumber;

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/orders');
  };

  if (loading && !order) {
    return (
      <View
        style={[
          styles.centerScreen,
          { paddingTop: insets.top + spacing.xl },
        ]}
      >
        <View style={styles.loadingIcon}>
          <Ionicons
            name="bicycle-outline"
            size={34}
            color={colors.primary}
          />
        </View>

        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loadingSpinner}
        />

        <Text style={styles.loadingTitle}>Loading your order</Text>
        <Text style={styles.mutedText}>
          Getting the latest information from the restaurant.
        </Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View
        style={[
          styles.centerScreen,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
      >
        <Pressable
          style={styles.backButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.emptyIcon}>
          <Ionicons
            name="receipt-outline"
            size={38}
            color={colors.primary}
          />
        </View>

        <Text style={styles.loadingTitle}>Order unavailable</Text>

        <Text style={styles.emptyDescription}>
          {loadError || 'We could not find this order. Please try again.'}
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryPressed,
          ]}
          onPress={() => loadOrder(true)}
          accessibilityRole="button"
        >
          <Ionicons name="refresh" size={18} color={colors.black} />
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace('/orders')}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Back to my orders</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Track your order</Text>
          <Text style={styles.headerSubtitle}>
            Order #
            {String(order.orderNumber || order._id)
              .slice(-8)
              .toUpperCase()}
          </Text>
        </View>

        <Pressable
          style={styles.headerButton}
          onPress={handleRefresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh order"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name="refresh-outline"
              size={21}
              color={colors.primary}
            />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loadError ? (
          <Pressable
            style={styles.warningBanner}
            onPress={handleRefresh}
            accessibilityRole="button"
          >
            <Ionicons
              name="cloud-offline-outline"
              size={20}
              color={colors.warning}
            />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>
                Could not refresh order
              </Text>
              <Text style={styles.mutedText}>
                Showing the last information received. Tap to retry.
              </Text>
            </View>
            <Ionicons
              name="refresh-outline"
              size={18}
              color={colors.warning}
            />
          </Pressable>
        ) : null}

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              <Ionicons
                name={
                  isCancelled
                    ? 'close-circle-outline'
                    : isDelivered
                      ? 'checkmark-done-circle-outline'
                      : 'bicycle-outline'
                }
                size={34}
                color={
                  isCancelled ? colors.danger : colors.secondary
                }
              />
            </View>

            <View
              style={[
                styles.statusPill,
                isDelivered && styles.deliveredPill,
                isCancelled && styles.cancelledPill,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  isDelivered && styles.deliveredDot,
                  isCancelled && styles.cancelledDot,
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  isCancelled && styles.cancelledStatusText,
                ]}
              >
                {formatStatus(status)}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            {isCancelled
              ? 'Order cancelled'
              : isDelivered
                ? 'Order delivered!'
                : status === 'ON_THE_WAY'
                  ? 'Your food is on the way!'
                  : status === 'READY'
                    ? 'Your order is ready!'
                    : status === 'PREPARING'
                      ? 'Your food is being prepared'
                      : status === 'CONFIRMED'
                        ? 'The restaurant confirmed your order'
                        : 'Your order is being processed'}
          </Text>

          <Text style={styles.heroDescription}>
            {isCancelled
              ? 'This order will no longer move through the delivery process.'
              : isDelivered
                ? 'The rider has completed this delivery.'
                : 'This page checks for the latest order status automatically.'}
          </Text>

          <View style={styles.heroDivider} />

          <View style={styles.restaurantRow}>
            <View style={styles.restaurantIcon}>
              <Ionicons
                name="restaurant-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{restaurantName}</Text>
              <Text style={styles.heroDate}>
                Ordered {formatDate(order.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {!isCancelled ? (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeadingContent}>
                <Text style={styles.sectionTitle}>Order progress</Text>
                <Text style={styles.sectionSubtitle}>
                  {isDelivered
                    ? 'All delivery steps are complete.'
                    : 'Follow each step of your order.'}
                </Text>
              </View>

              {!isDelivered ? (
                <View style={styles.liveBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              ) : (
                <Ionicons
                  name="checkmark-done-circle"
                  size={25}
                  color={colors.secondary}
                />
              )}
            </View>

            {progressIndex < 0 ? (
              <Text style={styles.mutedText}>
                Current status: {formatStatus(status)}. The timeline will
                update when the server returns a recognized order status.
              </Text>
            ) : (
              <View style={styles.timeline}>
                {STATUS_STEPS.map((step, index) => {
                  const completed = index <= progressIndex;
                  const current = index === progressIndex;
                  const last = index === STATUS_STEPS.length - 1;

                  return (
                    <View key={step.key} style={styles.timelineRow}>
                      <View style={styles.timelineRail}>
                        <View
                          style={[
                            styles.timelineIcon,
                            completed && styles.timelineIconCompleted,
                            current && styles.timelineIconCurrent,
                          ]}
                        >
                          <Ionicons
                            name={step.icon as any}
                            size={18}
                            color={
                              completed ? colors.black : colors.textLight
                            }
                          />
                        </View>

                        {!last ? (
                          <View
                            style={[
                              styles.timelineLine,
                              index < progressIndex &&
                                styles.timelineLineCompleted,
                            ]}
                          />
                        ) : null}
                      </View>

                      <View style={styles.timelineContent}>
                        <Text
                          style={[
                            styles.timelineTitle,
                            completed && styles.timelineTitleCompleted,
                          ]}
                        >
                          {step.title}
                        </Text>

                        <Text style={styles.timelineDescription}>
                          {step.description}
                        </Text>

                        {current && !isDelivered ? (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>
                              CURRENT STATUS
                            </Text>
                          </View>
                        ) : null}

                        {step.key === 'ON_THE_WAY' && order.pickedUpAt ? (
                          <Text style={styles.timestamp}>
                            Picked up: {formatDate(order.pickedUpAt)}
                          </Text>
                        ) : null}

                        {step.key === 'DELIVERED' && isDelivered ? (
                          <Text style={styles.timestamp}>
                            Delivered:{' '}
                            {formatDate(order.deliveredAt || order.updatedAt)}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {!isDelivered ? (
              <View style={styles.refreshHint}>
                <Ionicons
                  name="sync-outline"
                  size={15}
                  color={colors.primary}
                />
                <Text style={styles.refreshHintText}>
                  Status checks every 10 seconds while this screen is open.
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeadingContent}>
                <Text style={styles.sectionTitle}>Delivery stopped</Text>
                <Text style={styles.sectionSubtitle}>
                  This order has been cancelled.
                </Text>
              </View>
              <Ionicons
                name="alert-circle-outline"
                size={24}
                color={colors.danger}
              />
            </View>
            <Text style={styles.mutedText}>
              {order.cancellationReason ||
                'Contact support if you need help with this order.'}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeadingContent}>
              <Text style={styles.sectionTitle}>Order items</Text>
              <Text style={styles.sectionSubtitle}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'} from{' '}
                {restaurantName}
              </Text>
            </View>
            <View style={styles.sectionIcon}>
              <Ionicons
                name="fast-food-outline"
                size={22}
                color={colors.primary}
              />
            </View>
          </View>

          {items.length === 0 ? (
            <Text style={styles.mutedText}>
              No item details were returned.
            </Text>
          ) : (
            items.map((item, index) => {
              const quantity = Math.max(1, Number(item.quantity) || 1);
              const lineTotal =
                item.subtotal != null
                  ? Number(item.subtotal)
                  : getItemPrice(item) * quantity;

              return (
                <View
                  key={item._id || `${getItemName(item)}-${index}`}
                  style={styles.itemRow}
                >
                  <View style={styles.quantityBox}>
                    <Text style={styles.quantityText}>{quantity}×</Text>
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>
                      {getItemName(item)}
                    </Text>
                    {item.price != null || item.unitPrice != null ? (
                      <Text style={styles.itemUnitPrice}>
                        {formatMoney(item.price ?? item.unitPrice)} each
                      </Text>
                    ) : null}
                  </View>

                  <Text style={styles.itemPrice}>
                    {formatMoney(Number.isFinite(lineTotal) ? lineTotal : 0)}
                  </Text>
                </View>
              );
            })
          )}

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>{formatMoney(subtotal)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery fee</Text>
            <Text style={styles.priceValue}>{formatMoney(deliveryFee)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatMoney(totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeadingContent}>
              <Text style={styles.sectionTitle}>Delivery details</Text>
              <Text style={styles.sectionSubtitle}>
                Where your food is going.
              </Text>
            </View>
            <View style={styles.sectionIcon}>
              <Ionicons
                name="location-outline"
                size={22}
                color={colors.primary}
              />
            </View>
          </View>

          <View style={styles.detailBlock}>
            <View style={styles.detailIcon}>
              <Ionicons
                name="navigate-outline"
                size={18}
                color={colors.secondary}
              />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Delivery address</Text>
              <Text style={styles.detailValue}>
                {getDeliveryAddress(order)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailBlock}>
            <View style={styles.detailIcon}>
              <Ionicons
                name="card-outline"
                size={18}
                color={colors.secondary}
              />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Payment method</Text>
              <Text style={styles.detailValue}>
                {String(order.paymentMethod || 'Not specified')
                  .replace(/_/g, ' ')
                  .toUpperCase()}
              </Text>
              {order.paymentStatus ? (
                <Text style={styles.detailHint}>
                  Payment status: {formatStatus(order.paymentStatus)}
                </Text>
              ) : null}
            </View>
          </View>

          {order.notes || order.customerNote ? (
            <>
              <View style={styles.divider} />
              <View style={styles.detailBlock}>
                <View style={styles.detailIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={colors.secondary}
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Order notes</Text>
                  <Text style={styles.detailValue}>
                    {order.notes || order.customerNote}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {riderName || riderPhone ? (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeadingContent}>
                <Text style={styles.sectionTitle}>Delivery rider</Text>
                <Text style={styles.sectionSubtitle}>
                  Your delivery contact.
                </Text>
              </View>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="bicycle-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
            </View>

            {riderName ? (
              <View style={styles.detailBlock}>
                <View style={styles.detailIcon}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={colors.secondary}
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Rider name</Text>
                  <Text style={styles.detailValue}>{riderName}</Text>
                </View>
              </View>
            ) : null}

            {riderName && riderPhone ? <View style={styles.divider} /> : null}

            {riderPhone ? (
              <View style={styles.detailBlock}>
                <View style={styles.detailIcon}>
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={colors.secondary}
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Rider phone</Text>
                  <Text style={styles.detailValue}>{riderPhone}</Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryPressed,
            ]}
            onPress={handleRefresh}
            accessibilityRole="button"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <Ionicons name="refresh" size={18} color={colors.black} />
            )}
            <Text style={styles.primaryButtonText}>
              Refresh order status
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryPressed,
            ]}
            onPress={() => router.replace('/orders')}
            accessibilityRole="button"
          >
            <Ionicons
              name="receipt-outline"
              size={18}
              color={colors.text}
            />
            <Text style={styles.secondaryButtonText}>View all orders</Text>
          </Pressable>

          <Text style={styles.disclaimer}>
            Status updates depend on the latest order information returned
            by the server.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },

  loadingIcon: {
    width: 66,
    height: 66,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  loadingSpinner: {
    marginTop: spacing.md,
  },

  loadingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },

  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  mutedText: {
    fontSize: 12,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  headerInfo: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textSecondary,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: spacing.lg,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.md,
  },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warning,
  },

  warningContent: {
    flex: 1,
  },

  warningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 3,
  },

  heroCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },

  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },

  deliveredPill: {
    borderColor: colors.secondary,
    backgroundColor: 'rgba(198, 245, 74, 0.08)',
  },

  cancelledPill: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(255, 98, 104, 0.08)',
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  deliveredDot: {
    backgroundColor: colors.secondary,
  },

  cancelledDot: {
    backgroundColor: colors.danger,
  },

  statusPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.text,
  },

  cancelledStatusText: {
    color: colors.danger,
  },

  heroTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: colors.text,
  },

  heroDescription: {
    fontSize: 12,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  heroDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },

  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  restaurantIcon: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 107, 26, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  restaurantInfo: {
    flex: 1,
  },

  restaurantName: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },

  heroDate: {
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  sectionHeadingContent: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.text,
  },

  sectionSubtitle: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 26, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 26, 0.16)',
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: 'rgba(198, 245, 74, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(198, 245, 74, 0.20)',
  },

  liveText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.secondary,
    letterSpacing: 0.5,
  },

  timeline: {
    paddingTop: 2,
  },

  timelineRow: {
    flexDirection: 'row',
    minHeight: 82,
  },

  timelineRail: {
    width: 42,
    alignItems: 'center',
  },

  timelineIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },

  timelineIconCompleted: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },

  timelineIconCurrent: {
    borderWidth: 3,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
    backgroundColor: colors.border,
  },

  timelineLineCompleted: {
    backgroundColor: colors.secondary,
  },

  timelineContent: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingTop: 2,
    paddingBottom: spacing.lg,
  },

  timelineTitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: colors.textLight,
  },

  timelineTitleCompleted: {
    color: colors.text,
  },

  timelineDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  currentBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 107, 26, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 26, 0.20)',
  },

  currentBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: colors.primary,
  },

  timestamp: {
    marginTop: spacing.sm,
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },

  refreshHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  refreshHintText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  quantityBox: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 26, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 26, 0.18)',
  },

  quantityText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary,
  },

  itemInfo: {
    flex: 1,
    minWidth: 0,
  },

  itemName: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    color: colors.text,
  },

  itemUnitPrice: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textSecondary,
  },

  itemPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.text,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginVertical: 5,
  },

  priceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  priceValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
  },

  totalValue: {
    fontSize: 21,
    fontWeight: '900',
    color: colors.primary,
  },

  detailBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },

  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },

  detailContent: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 5,
  },

  detailValue: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '800',
    color: colors.text,
  },

  detailHint: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    color: colors.secondary,
  },

  actions: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },

  primaryButton: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },

  primaryPressed: {
    backgroundColor: colors.primaryDark,
    opacity: 0.9,
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.black,
  },

  secondaryButton: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  secondaryPressed: {
    backgroundColor: colors.surfaceAlt,
  },

  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },

  disclaimer: {
    fontSize: 10,
    lineHeight: 17,
    textAlign: 'center',
    color: colors.textLight,
    paddingHorizontal: spacing.md,
  },
});
