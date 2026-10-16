import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../services/api';
import { getAuthToken } from '../../services/auth/authStorage';
import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';

type OrderStatus =
  | 'PLACED'
  | 'RECEIVED'
  | 'PREPARING'
  | 'READY'
  | 'ON_ROUTE'
  | 'DELIVERED'
  | 'CANCELLED';

type OrderItem = {
  menuItem?: string;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  total: number;
};

type RestaurantOrder = {
  _id: string;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  alternatePhone?: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryArea: string;
  customerNote?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: OrderStatus;
  rider?: {
    _id?: string;
    name?: string;
    phone?: string;
  } | null;
  createdAt: string;
};

type OrdersResponse = {
  success: boolean;
  message?: string;
  orders: RestaurantOrder[];
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: 'New order',
  RECEIVED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready for pickup',
  ON_ROUTE: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const formatMoney = (value: number) =>
  `Rs. ${Number(value || 0).toLocaleString('en-PK')}`;

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Recently';

  return date.toLocaleString('en-PK', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getStatusColor = (status: OrderStatus) => {
  if (status === 'DELIVERED') return colors.secondary;
  if (status === 'CANCELLED') return colors.danger;
  if (status === 'READY' || status === 'ON_ROUTE') {
    return colors.honey;
  }
  if (status === 'PREPARING') return colors.primary;
  return colors.textSecondary;
};

const showMessage = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    }
    return;
  }

  Alert.alert(title, message);
};

export default function BusinessOrdersScreen() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ACTIVE' | 'ALL'>('ACTIVE');
  const [error, setError] = useState('');

  const loadOrders = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error('Please log in to access restaurant orders.');
      }

      const response = await api.get<OrdersResponse>(
        '/business/orders',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders(
        Array.isArray(response.data.orders)
          ? response.data.orders
          : []
      );
      setError('');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load restaurant orders.';

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders(true);

    const interval = setInterval(() => {
      void loadOrders(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [loadOrders]);

  const updateOrder = async (
    order: RestaurantOrder,
    action: 'accept' | 'reject' | 'prepare' | 'ready'
  ) => {
    const actionLabels = {
      accept: 'accept this order',
      reject: 'reject this order',
      prepare: 'start preparing this order',
      ready: 'mark this order ready for pickup',
    };

    if (busyOrderId) return;

    if (action === 'reject') {
      const confirmed =
        Platform.OS === 'web'
          ? typeof window !== 'undefined' &&
            window.confirm('Reject this order?')
          : await new Promise<boolean>((resolve) => {
              Alert.alert(
                'Reject order?',
                'This order will be cancelled.',
                [
                  {
                    text: 'Keep order',
                    style: 'cancel',
                    onPress: () => resolve(false),
                  },
                  {
                    text: 'Reject order',
                    style: 'destructive',
                    onPress: () => resolve(true),
                  },
                ],
                {
                  cancelable: true,
                  onDismiss: () => resolve(false),
                }
              );
            });

      if (!confirmed) return;
    }

    setBusyOrderId(order._id);

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error(
          'Your session has expired. Please log in again.'
        );
      }

      await api.patch(
        `/business/orders/${order._id}/${action}`,
        action === 'reject'
          ? { reason: 'Rejected by restaurant.' }
          : {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadOrders(false);

      const successMessages = {
        accept: 'Order accepted.',
        reject: 'Order rejected.',
        prepare: 'Preparation started.',
        ready: 'Order is ready for pickup.',
      };

      showMessage('Success', successMessages[action]);
    } catch (err: any) {
      showMessage(
        'Could not update order',
        err?.response?.data?.message ||
          err?.message ||
          `Failed to ${actionLabels[action]}.`
      );

      await loadOrders(false);
    } finally {
      setBusyOrderId(null);
    }
  };

  const visibleOrders = orders.filter((order) => {
    if (filter === 'ALL') return true;

    return !['DELIVERED', 'CANCELLED'].includes(order.status);
  });

  const newCount = orders.filter(
    (order) => order.status === 'PLACED'
  ).length;

  const activeCount = orders.filter((order) =>
    ['RECEIVED', 'PREPARING', 'READY', 'ON_ROUTE'].includes(
      order.status
    )
  ).length;

  const completedCount = orders.filter(
    (order) => order.status === 'DELIVERED'
  ).length;

  const renderActionButton = (
    order: RestaurantOrder,
    action: 'accept' | 'reject' | 'prepare' | 'ready',
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    primary = true
  ) => {
    const isBusy = busyOrderId === order._id;

    return (
      <Pressable
        key={action}
        accessibilityRole="button"
        disabled={Boolean(busyOrderId)}
        onPress={() => void updateOrder(order, action)}
        style={({ pressed }) => [
          styles.actionButton,
          primary
            ? styles.primaryAction
            : styles.secondaryAction,
          pressed && styles.pressed,
          Boolean(busyOrderId) && styles.disabled,
        ]}
      >
        {isBusy ? (
          <ActivityIndicator
            size="small"
            color={primary ? colors.black : colors.danger}
          />
        ) : (
          <Ionicons
            name={icon}
            size={17}
            color={primary ? colors.black : colors.danger}
          />
        )}

        <Text
          style={[
            styles.actionText,
            {
              color: primary ? colors.black : colors.danger,
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const renderOrderActions = (order: RestaurantOrder) => {
    if (order.status === 'PLACED') {
      return (
        <View style={styles.actionsRow}>
          {renderActionButton(
            order,
            'accept',
            'Accept order',
            'checkmark-circle'
          )}
          {renderActionButton(
            order,
            'reject',
            'Reject',
            'close-circle',
            false
          )}
        </View>
      );
    }

    if (order.status === 'RECEIVED') {
      return (
        <View style={styles.actionsRow}>
          {renderActionButton(
            order,
            'prepare',
            'Start preparing',
            'restaurant'
          )}
        </View>
      );
    }

    if (order.status === 'PREPARING') {
      return (
        <View style={styles.actionsRow}>
          {renderActionButton(
            order,
            'ready',
            'Ready for pickup',
            'bicycle'
          )}
        </View>
      );
    }

    if (order.status === 'READY' && order.rider) {
      return (
        <HelperMessage>
          Rider assigned. Waiting for pickup.
        </HelperMessage>
      );
    }

    if (order.status === 'READY') {
      return (
        <HelperMessage>
          Waiting for a rider to accept this delivery.
        </HelperMessage>
      );
    }

    if (order.status === 'ON_ROUTE') {
      return (
        <HelperMessage>
          The rider has picked up this order.
        </HelperMessage>
      );
    }

    if (order.status === 'DELIVERED') {
      return (
        <HelperMessage success>
          Delivery completed.
        </HelperMessage>
      );
    }

    return (
      <HelperMessage danger>
        This order was cancelled.
      </HelperMessage>
    );
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/business');
            }}
            style={styles.iconButton}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              RESTAURANT MANAGEMENT
            </Text>
            <Text style={styles.title}>Orders</Text>
            <Text style={styles.subtitle}>
              Receive, prepare and hand over deliveries.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh orders"
            onPress={() => {
              setRefreshing(true);
              void loadOrders(false);
            }}
            style={styles.iconButton}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={colors.text}
            />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            value={newCount}
            label="New"
            accent={colors.primary}
            icon="notifications-outline"
          />
          <StatCard
            value={activeCount}
            label="In progress"
            accent={colors.honey}
            icon="time-outline"
          />
          <StatCard
            value={completedCount}
            label="Delivered"
            accent={colors.secondary}
            icon="checkmark-circle-outline"
          />
        </View>

        <View style={styles.filterRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setFilter('ACTIVE')}
            style={[
              styles.filterButton,
              filter === 'ACTIVE' && styles.activeFilter,
            ]}
          >
            <Ionicons
              name="flash-outline"
              size={15}
              color={
                filter === 'ACTIVE'
                  ? colors.black
                  : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.filterText,
                filter === 'ACTIVE' && styles.activeFilterText,
              ]}
            >
              Active orders
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setFilter('ALL')}
            style={[
              styles.filterButton,
              filter === 'ALL' && styles.activeFilter,
            ]}
          >
            <Ionicons
              name="receipt-outline"
              size={15}
              color={
                filter === 'ALL'
                  ? colors.black
                  : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.filterText,
                filter === 'ALL' && styles.activeFilterText,
              ]}
            >
              Order history
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />
            <Text style={styles.stateText}>
              Loading restaurant orders...
            </Text>
          </View>
        ) : error && orders.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.stateIcon}>
              <Ionicons
                name="cloud-offline-outline"
                size={34}
                color={colors.textSecondary}
              />
            </View>
            <Text style={styles.stateTitle}>
              Orders unavailable
            </Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => void loadOrders(true)}
            >
              <Ionicons
                name="refresh"
                size={16}
                color={colors.black}
              />
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  void loadOrders(false);
                }}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {visibleOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="receipt-outline"
                    size={34}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.stateTitle}>
                  No orders here yet
                </Text>
                <Text style={styles.stateText}>
                  New customer orders will appear here automatically.
                </Text>
              </View>
            ) : (
              visibleOrders.map((order) => {
                const statusColor = getStatusColor(order.status);

                return (
                  <View key={order._id} style={styles.orderCard}>
                    <View style={styles.orderTop}>
                      <View style={styles.orderNumberContainer}>
                        <Text style={styles.orderNumber}>
                          {order.orderNumber ||
                            `Order #${order._id
                              .slice(-6)
                              .toUpperCase()}`}
                        </Text>
                        <Text style={styles.orderDate}>
                          {formatDate(order.createdAt)}
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
                          {STATUS_LABELS[order.status] ||
                            order.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sectionDivider} />

                    <DetailRow
                      icon="person-outline"
                      label="CUSTOMER"
                      value={order.customerName}
                      subvalue={`${order.customerPhone}${
                        order.alternatePhone
                          ? ` · ${order.alternatePhone}`
                          : ''
                      }`}
                    />

                    <DetailRow
                      icon="location-outline"
                      label="DELIVERY ADDRESS"
                      value={order.deliveryAddress}
                      subvalue={[
                        order.deliveryArea,
                        order.deliveryCity,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    />

                    {order.customerNote ? (
                      <View style={styles.noteBox}>
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={17}
                          color={colors.primary}
                        />
                        <Text style={styles.noteText}>
                          {order.customerNote}
                        </Text>
                      </View>
                    ) : null}

                    <Text style={styles.itemsHeading}>
                      ORDER ITEMS
                    </Text>

                    {order.items.map((item, index) => (
                      <View
                        key={`${order._id}-${index}`}
                        style={styles.itemRow}
                      >
                        <View style={styles.quantityBadge}>
                          <Text style={styles.quantityText}>
                            {item.quantity}×
                          </Text>
                        </View>
                        <Text style={styles.itemName}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemPrice}>
                          {formatMoney(item.total)}
                        </Text>
                      </View>
                    ))}

                    <View style={styles.totalSection}>
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>
                          Subtotal
                        </Text>
                        <Text style={styles.totalMuted}>
                          {formatMoney(order.subtotal)}
                        </Text>
                      </View>
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>
                          Delivery fee
                        </Text>
                        <Text style={styles.totalMuted}>
                          {formatMoney(order.deliveryFee)}
                        </Text>
                      </View>
                      <View style={styles.totalRow}>
                        <Text style={styles.grandTotalLabel}>
                          Total
                        </Text>
                        <Text style={styles.grandTotal}>
                          {formatMoney(order.totalAmount)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.paymentRow}>
                      <Ionicons
                        name="card-outline"
                        size={16}
                        color={colors.textLight}
                      />
                      <Text style={styles.paymentText}>
                        {(order.paymentMethod || '')
                          .replace(/_/g, ' ')}
                      </Text>
                      <View style={styles.paymentDivider} />
                      <Text style={styles.paymentText}>
                        Payment: {order.paymentStatus || 'PENDING'}
                      </Text>
                    </View>

                    {order.rider ? (
                      <View style={styles.riderBox}>
                        <View style={styles.riderIcon}>
                          <Ionicons
                            name="bicycle-outline"
                            size={20}
                            color={colors.secondary}
                          />
                        </View>
                        <View style={styles.riderContent}>
                          <Text style={styles.riderTitle}>
                            Assigned rider
                          </Text>
                          <Text style={styles.riderSubtext}>
                            {order.rider.name || 'Rider assigned'}
                            {order.rider.phone
                              ? ` · ${order.rider.phone}`
                              : ''}
                          </Text>
                        </View>
                        <Ionicons
                          name="checkmark-circle"
                          size={19}
                          color={colors.secondary}
                        />
                      </View>
                    ) : null}

                    <View style={styles.cardFooter}>
                      {renderOrderActions(order)}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function StatCard({
  value,
  label,
  accent,
  icon,
}: {
  value: number;
  label: string;
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <Ionicons name={icon} size={17} color={accent} />
        <Text style={[styles.statValue, { color: accent }]}>
          {value}
        </Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  subvalue,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  subvalue?: string;
}) {
  return (
    <View style={styles.customerRow}>
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={colors.primary}
        />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
        {subvalue ? (
          <Text style={styles.detailSubvalue}>{subvalue}</Text>
        ) : null}
      </View>
    </View>
  );
}

function HelperMessage({
  children,
  success = false,
  danger = false,
}: {
  children: React.ReactNode;
  success?: boolean;
  danger?: boolean;
}) {
  const color = success
    ? colors.secondary
    : danger
      ? colors.danger
      : colors.textSecondary;

  return (
    <View style={styles.helperRow}>
      <Ionicons
        name={
          success
            ? 'checkmark-circle-outline'
            : danger
              ? 'close-circle-outline'
              : 'information-circle-outline'
        }
        size={17}
        color={color}
      />
      <Text style={[styles.helperText, { color }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },

  iconButton: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },

  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.xs,
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  statCard: {
    flex: 1,
    minWidth: 0,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },

  statValue: {
    fontSize: 23,
    fontWeight: '900',
  },

  statLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: spacing.sm,
  },

  filterRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },

  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },

  activeFilter: {
    backgroundColor: colors.primary,
  },

  filterText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },

  activeFilterText: {
    color: colors.black,
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },

  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  orderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  orderNumberContainer: {
    flex: 1,
    minWidth: 0,
  },

  orderNumber: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },

  orderDate: {
    color: colors.textLight,
    fontSize: 11,
    marginTop: spacing.sm,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    maxWidth: '54%',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '900',
    flexShrink: 1,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailContent: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },

  detailLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: spacing.xs,
  },

  detailValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },

  detailSubvalue: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
    lineHeight: 17,
  },

  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  noteText: {
    color: colors.text,
    fontSize: 12,
    flex: 1,
    lineHeight: 19,
  },

  itemsHeading: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  quantityBadge: {
    minWidth: 35,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },

  quantityText: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '900',
  },

  itemName: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },

  itemPrice: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },

  totalSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },

  totalLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  totalMuted: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },

  grandTotalLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },

  grandTotal: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '900',
  },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  paymentText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },

  paymentDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.border,
  },

  riderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },

  riderIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  riderContent: {
    flex: 1,
    minWidth: 0,
  },

  riderTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },

  riderSubtext: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.xs,
    lineHeight: 16,
  },

  cardFooter: {
    marginTop: spacing.lg,
  },

  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  actionButton: {
    flexGrow: 1,
    flexBasis: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minHeight: 46,
  },

  primaryAction: {
    backgroundColor: colors.primary,
  },

  secondaryAction: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.danger,
  },

  actionText: {
    fontSize: 11,
    fontWeight: '900',
  },

  pressed: {
    opacity: 0.8,
  },

  disabled: {
    opacity: 0.55,
  },

  helperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },

  helperText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.md,
  },

  stateIcon: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  stateTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },

  stateText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },

  retryText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '900',
  },
});
