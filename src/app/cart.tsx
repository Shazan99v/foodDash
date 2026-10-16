import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../constants/theme';
import { useCartStore } from '../stores/cartStore';

const formatPrice = (amount: number) =>
  `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;

export default function CartScreen() {
  const insets = useSafeAreaInsets();

  const items = useCartStore((state) => state.items);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const restaurantName = items[0]?.restaurantName ?? '';

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [items]
  );

  const deliveryFee = useMemo(() => {
    if (items.length === 0) return 0;
    return subtotal >= 1500 ? 0 : 99;
  }, [items.length, subtotal]);

  const total = subtotal + deliveryFee;

  const itemCount = useMemo(
    () => items.reduce((count, item) => count + item.quantity, 0),
    [items]
  );

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.emptyHeader,
            { paddingTop: Math.max(insets.top + 8, 16) },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Your Cart</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <View style={styles.emptyIconInner}>
              <Ionicons
                name="bag-handle-outline"
                size={38}
                color={colors.primary}
              />
            </View>
          </View>

          <Text style={styles.emptyEyebrow}>NOTHING HERE YET</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>

          <Text style={styles.emptyDescription}>
            Your next favourite meal is waiting. Explore restaurants and add
            something delicious to get started.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.browseButton}
            onPress={() => router.push('/explore')}
          >
            <Text style={styles.browseButtonText}>Explore Restaurants</Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.black}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToFoodButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.backToFoodText}>Back to home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 180 },
        ]}
      >
        <View
          style={[
            styles.header,
            { paddingTop: Math.max(insets.top + 8, 16) },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Your Cart</Text>
            <Text style={styles.headerSubtitle}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} ready to go
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.clearButton}
            onPress={() => void clearCart()}
            accessibilityLabel="Clear cart"
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={colors.danger}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.pageIntro}>
          <View style={styles.pageIntroAccent} />
          <View style={styles.pageIntroContent}>
            <Text style={styles.pageIntroTitle}>Good choices.</Text>
            <Text style={styles.pageIntroSubtitle}>
              Let's make them a meal.
            </Text>
          </View>
          <View style={styles.pageIntroIcon}>
            <Ionicons
              name="fast-food-outline"
              size={27}
              color={colors.secondary}
            />
          </View>
        </View>

        <View style={styles.restaurantCard}>
          <View style={styles.restaurantIcon}>
            <Ionicons
              name="restaurant-outline"
              size={20}
              color={colors.primary}
            />
          </View>

          <View style={styles.restaurantContent}>
            <Text style={styles.restaurantLabel}>YOUR RESTAURANT</Text>
            <Text style={styles.restaurantName} numberOfLines={1}>
              {restaurantName}
            </Text>
          </View>

          <View style={styles.verifiedIcon}>
            <Ionicons
              name="checkmark"
              size={14}
              color={colors.black}
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Your items</Text>
            <Text style={styles.sectionSubtitle}>
              Review your picks before checkout
            </Text>
          </View>

          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountBadgeText}>{itemCount}</Text>
          </View>
        </View>

        <View style={styles.itemsCard}>
          {items.map((item, index) => (
            <View key={item.id}>
              <View style={styles.cartItem}>
                <View style={styles.itemImageContainer}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                </View>

                <View style={styles.itemContent}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>

                  <Text style={styles.itemPrice}>
                    {formatPrice(item.price)}
                    <Text style={styles.eachLabel}> / each</Text>
                  </Text>

                  <View style={styles.quantityRow}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={styles.quantityButton}
                      onPress={() => decreaseQuantity(item.id)}
                      accessibilityLabel={`Decrease quantity of ${item.name}`}
                    >
                      <Ionicons
                        name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                        size={item.quantity === 1 ? 14 : 17}
                        color={item.quantity === 1 ? colors.danger : colors.text}
                      />
                    </TouchableOpacity>

                    <Text style={styles.quantity}>{item.quantity}</Text>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={styles.quantityButtonAdd}
                      onPress={() => increaseQuantity(item.id)}
                      accessibilityLabel={`Increase quantity of ${item.name}`}
                    >
                      <Ionicons
                        name="add"
                        size={17}
                        color={colors.black}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.itemRight}>
                  <Text style={styles.itemTotal}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>

                  <Pressable
                    hitSlop={10}
                    onPress={() => removeItem(item.id)}
                    style={styles.removeButton}
                    accessibilityLabel={`Remove ${item.name}`}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={15}
                      color={colors.textLight}
                    />
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              </View>

              {index < items.length - 1 && (
                <View style={styles.itemDivider} />
              )}
            </View>
          ))}
        </View>

        <View style={styles.deliveryCard}>
          <View style={styles.deliveryIcon}>
            <Ionicons
              name="bicycle-outline"
              size={23}
              color={colors.secondary}
            />
          </View>

          <View style={styles.deliveryContent}>
            <Text style={styles.deliveryTitle}>Delivery to your door</Text>
            <Text style={styles.deliverySubtitle}>
              Estimated delivery in 20–30 min
            </Text>
          </View>

          <View style={styles.deliveryPriceContainer}>
            <Text
              style={[
                styles.deliveryPrice,
                deliveryFee === 0 && styles.freeDelivery,
              ]}
            >
              {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
            </Text>
            {deliveryFee === 0 && (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.secondary}
              />
            )}
          </View>
        </View>

        {deliveryFee > 0 && (
          <View style={styles.freeDeliveryHint}>
            <View style={styles.freeDeliveryHintIcon}>
              <Ionicons
                name="sparkles"
                size={14}
                color={colors.secondary}
              />
            </View>
            <Text style={styles.freeDeliveryHintText}>
              Add{' '}
              <Text style={styles.freeDeliveryAmount}>
                {formatPrice(1500 - subtotal)}
              </Text>{' '}
              more to unlock free delivery
            </Text>
          </View>
        )}

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeading}>
            <View>
              <Text style={styles.summaryTitle}>Order summary</Text>
              <Text style={styles.summarySubtitle}>A little breakdown</Text>
            </View>
            <Ionicons
              name="receipt-outline"
              size={22}
              color={colors.primary}
            />
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text
              style={[
                styles.summaryValue,
                deliveryFee === 0 && styles.freeDelivery,
              ]}
            >
              {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalCaption}>Inclusive of listed items</Text>
            </View>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        <View style={styles.secureNote}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={colors.secondary}
          />
          <Text style={styles.secureNoteText}>
            Your order details will be confirmed at checkout.
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.checkoutContainer,
          { paddingBottom: Math.max(insets.bottom + 10, 18) },
        ]}
      >
        <View style={styles.checkoutInfo}>
          <View>
            <Text style={styles.checkoutLabel}>TOTAL TO PAY</Text>
            <Text style={styles.checkoutTotal}>{formatPrice(total)}</Text>
          </View>

          <View style={styles.checkoutItemsBadge}>
            <Ionicons
              name="bag-check-outline"
              size={14}
              color={colors.secondary}
            />
            <Text style={styles.checkoutItems}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <View style={styles.checkoutButtonIcon}>
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={colors.black}
            />
          </View>
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Ionicons
            name="arrow-forward"
            size={19}
            color={colors.black}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
  },
  emptyHeader: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },
  headerSpacer: {
    width: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    minHeight: 92,
  },
  pageIntroAccent: {
    width: 5,
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
  },
  pageIntroContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pageIntroTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  pageIntroSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  pageIntroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  restaurantIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantContent: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  restaurantLabel: {
    color: colors.textLight,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  restaurantName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },
  verifiedIcon: {
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
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
    fontSize: 10,
    marginTop: 4,
  },
  itemCountBadge: {
    minWidth: 31,
    height: 31,
    borderRadius: 11,
    paddingHorizontal: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCountBadgeText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '900',
  },
  itemsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
  },
  itemImageContainer: {
    width: 76,
    height: 82,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemContent: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  itemName: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  itemPrice: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 5,
  },
  eachLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '500',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonAdd: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
    minWidth: 29,
    textAlign: 'center',
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingVertical: 3,
  },
  itemTotal: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'right',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  removeText: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '700',
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  deliveryIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryContent: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  deliveryTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  deliverySubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 4,
  },
  deliveryPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  deliveryPrice: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },
  freeDelivery: {
    color: colors.secondary,
  },
  freeDeliveryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  freeDeliveryHintIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeDeliveryHintText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    marginLeft: spacing.sm,
    lineHeight: 16,
  },
  freeDeliveryAmount: {
    color: colors.secondary,
    fontWeight: '900',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  summaryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  summarySubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  totalLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  totalCaption: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 4,
  },
  totalValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  secureNoteText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
  },
  checkoutContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primaryDark,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  checkoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  checkoutLabel: {
    color: colors.textLight,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  checkoutTotal: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 3,
  },
  checkoutItemsBadge: {
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
  checkoutItems: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  checkoutButton: {
    minHeight: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  checkoutButtonIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: '#B3E13A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '900',
    flex: 1,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 70,
  },
  emptyIcon: {
    width: 104,
    height: 104,
    borderRadius: 34,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyIconInner: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 290,
  },
  browseButton: {
    minHeight: 52,
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  browseButtonText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '900',
  },
  backToFoodButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backToFoodText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
});
