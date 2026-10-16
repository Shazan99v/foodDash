import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  RefreshControl,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';

import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';

import {
  acceptRiderOrder,
  getAvailableRiderOrders,
} from '../../services/rider/riderOrderApi';

type Order = {
  _id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryArea: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  restaurant?: {
    name?: string;
    address?: string;
    city?: string;
    area?: string;
  };
  createdAt: string;
};

export default function AvailableOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const loadOrders = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        const data = await getAvailableRiderOrders();

        if (!data?.success) {
          throw new Error(
            data?.message || 'Failed to load available deliveries.'
          );
        }

        setOrders(
          Array.isArray(data.orders) ? data.orders : []
        );
      } catch (error: any) {
        console.error('Load available rider orders error:', error);

        Toast.show({
          type: 'error',
          text1: 'Orders Error',
          text2:
            error?.response?.data?.message ||
            error?.message ||
            'Failed to load available deliveries.',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders(false);
  };

  const handleAccept = async (orderId: string) => {
    try {
      setAcceptingId(orderId);

      const data = await acceptRiderOrder(orderId);

      if (!data?.success) {
        throw new Error(
          data?.message || 'Failed to accept delivery.'
        );
      }

      setOrders((currentOrders) =>
        currentOrders.filter((order) => order._id !== orderId)
      );

      Toast.show({
        type: 'success',
        text1: 'Delivery Accepted',
        text2: 'The order has been added to your deliveries.',
      });
    } catch (error: any) {
      console.error('Accept rider order error:', error);

      Toast.show({
        type: 'error',
        text1: 'Unable to Accept',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to accept delivery.',
      });

      loadOrders(false);
    } finally {
      setAcceptingId(null);
    }
  };

  const renderOrder = (order: Order) => {
    const itemCount = order.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const restaurantName = order.restaurant?.name || 'Restaurant';
    const isAccepting = acceptingId === order._id;

    return (
      <View key={order._id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.restaurantIcon}>
            <Ionicons
              name="restaurant-outline"
              size={23}
              color={colors.primary}
            />
          </View>

          <View style={styles.restaurantInfo}>
            <Text
              style={styles.restaurantName}
              numberOfLines={1}
            >
              {restaurantName}
            </Text>

            <View style={styles.readyBadge}>
              <View style={styles.readyDot} />
              <Text style={styles.orderStatus}>
                READY FOR PICKUP
              </Text>
            </View>
          </View>

          <Text style={styles.amount}>
            Rs. {order.totalAmount}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="person-outline"
              size={17}
              color={colors.textSecondary}
            />
          </View>

          <Text style={styles.infoText} numberOfLines={1}>
            {order.customerName}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="location-outline"
              size={17}
              color={colors.textSecondary}
            />
          </View>

          <Text style={styles.infoText} numberOfLines={3}>
            {order.deliveryAddress}, {order.deliveryArea},{' '}
            {order.deliveryCity}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="bag-outline"
              size={17}
              color={colors.textSecondary}
            />
          </View>

          <Text style={styles.infoText}>
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.paymentRow}>
          <View>
            <Text style={styles.smallLabel}>PAYMENT METHOD</Text>
            <Text style={styles.paymentMethod}>
              {order.paymentMethod}
            </Text>
          </View>

          <View style={styles.deliveryFeeBox}>
            <Text style={styles.smallLabel}>DELIVERY FEE</Text>
            <Text style={styles.deliveryFee}>
              Rs. {order.deliveryFee}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.acceptButton,
            isAccepting && styles.acceptButtonDisabled,
            pressed && !isAccepting && styles.buttonPressed,
          ]}
          onPress={() => handleAccept(order._id)}
          disabled={isAccepting}
        >
          {isAccepting ? (
            <ActivityIndicator color={colors.black} />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color={colors.black}
              />

              <Text style={styles.acceptButtonText}>
                Accept Delivery
              </Text>

              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.black}
              />
            </>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
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

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>RIDER DASHBOARD</Text>
          <Text style={styles.title}>Available Deliveries</Text>
          <Text style={styles.subtitle}>
            Orders waiting for pickup
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{orders.length}</Text>
        </View>
      </View>

      <View style={styles.headerAccent} />

      {loading ? (
        <View style={styles.center}>
          <View style={styles.loadingIcon}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />
          </View>

          <Text style={styles.loadingText}>
            Finding deliveries...
          </Text>

          <Text style={styles.loadingSubtext}>
            Checking for orders ready to pick up
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            orders.length === 0 && styles.emptyContent,
          ]}
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
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconOuter}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="bicycle-outline"
                    size={43}
                    color={colors.primary}
                  />
                </View>
              </View>

              <View style={styles.emptyBadge}>
                <View style={styles.emptyBadgeDot} />
                <Text style={styles.emptyBadgeText}>
                  WAITING FOR ORDERS
                </Text>
              </View>

              <Text style={styles.emptyTitle}>
                No deliveries yet
              </Text>

              <Text style={styles.emptyText}>
                There are no available delivery requests right now.
                Pull down to refresh or check again shortly.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.refreshButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => loadOrders()}
              >
                <Ionicons
                  name="refresh-outline"
                  size={19}
                  color={colors.black}
                />

                <Text style={styles.refreshButtonText}>
                  Check Again
                </Text>
              </Pressable>

              <Text style={styles.pullHint}>
                <Ionicons
                  name="arrow-down-outline"
                  size={13}
                  color={colors.textLight}
                />{' '}
                Pull down to refresh
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.onlineNotice}>
                <View style={styles.onlineIcon}>
                  <Ionicons
                    name="radio-outline"
                    size={20}
                    color={colors.secondary}
                  />
                </View>

                <View style={styles.onlineNoticeText}>
                  <Text style={styles.onlineTitle}>
                    Deliveries are available
                  </Text>
                  <Text style={styles.onlineSubtitle}>
                    Review the details before accepting an order.
                  </Text>
                </View>

                <View style={styles.onlineDot} />
              </View>

              <View style={styles.sectionHeading}>
                <View>
                  <Text style={styles.sectionTitle}>
                    New requests
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Choose a delivery to get started
                  </Text>
                </View>

                <View style={styles.sectionCount}>
                  <Text style={styles.sectionCountText}>
                    {orders.length}
                  </Text>
                </View>
              </View>

              {orders.map(renderOrder)}
            </>
          )}
        </ScrollView>
      )}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
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
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  countBadge: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },

  countText: {
    color: colors.black,
    fontSize: 15,
    fontWeight: '900',
  },

  headerAccent: {
    height: 1,
    backgroundColor: colors.border,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  onlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  onlineIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.md,
  },

  onlineNoticeText: {
    flex: 1,
    marginRight: spacing.sm,
  },

  onlineTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  onlineSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  onlineDot: {
    width: 9,
    height: 9,
    borderRadius: radius.round,
    backgroundColor: colors.secondary,
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
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  sectionCount: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },

  sectionCountText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '900',
  },

  orderCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  restaurantIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },

  restaurantInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },

  restaurantName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },

  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(198, 245, 74, 0.09)',
  },

  readyDot: {
    width: 6,
    height: 6,
    borderRadius: radius.round,
    backgroundColor: colors.secondary,
    marginRight: 5,
  },

  orderStatus: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  amount: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
    flexShrink: 0,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },

  infoIcon: {
    width: 24,
    alignItems: 'center',
    paddingTop: 1,
  },

  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginLeft: spacing.sm,
  },

  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  deliveryFeeBox: {
    alignItems: 'flex-end',
  },

  smallLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  paymentMethod: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 5,
  },

  deliveryFee: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 5,
  },

  acceptButton: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
  },

  acceptButtonDisabled: {
    opacity: 0.65,
  },

  acceptButtonText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
    textAlign: 'center',
  },

  buttonPressed: {
    opacity: 0.75,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
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

  loadingText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: spacing.lg,
  },

  loadingSubtext: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },

  emptyIconOuter: {
    width: 112,
    height: 112,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.xl,
  },

  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  emptyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },

  emptyBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },

  emptyBadgeText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  emptyText: {
    maxWidth: 310,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  refreshButton: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
  },

  refreshButtonText: {
    color: colors.black,
    fontSize: 13,
    fontWeight: '900',
  },

  pullHint: {
    color: colors.textLight,
    fontSize: 11,
    marginTop: spacing.xl,
  },
});
