import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
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

import {
  BusinessMenuItem,
  BusinessMenuItemCategory,
  getMyMenuItems,
  updateMyMenuItemStatus,
} from '../../services/business/businessApi';
import { colors, radius, spacing } from '../../constants/theme';

const getCategoryName = (
  category: string | BusinessMenuItemCategory
) => {
  if (typeof category === 'object' && category !== null) {
    return category.name;
  }

  return 'Uncategorized';
};

const isCategoryActive = (
  category: string | BusinessMenuItemCategory
) => {
  if (typeof category === 'object' && category !== null) {
    return category.isActive;
  }

  return true;
};

export default function BusinessMenuItemsScreen() {
  const [items, setItems] = useState<BusinessMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const data = await getMyMenuItems();
      setItems(data);
    } catch (error: any) {
      console.error('Load business menu items error:', error);

      Toast.show({
        type: 'error',
        text1: 'Unable to load menu items',
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

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [loadItems])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadItems();
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/business');
    }
  };

  const handleToggle = async (item: BusinessMenuItem) => {
    if (updatingId) return;

    const categoryActive = isCategoryActive(item.category);

    if (!categoryActive) {
      Toast.show({
        type: 'info',
        text1: 'Category is disabled',
        text2: 'Enable the category first to make this item available.',
      });
      return;
    }

    const newStatus = !item.isAvailable;
    setUpdatingId(item._id);

    try {
      const updatedItem = await updateMyMenuItemStatus(
        item._id,
        newStatus
      );

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem._id === updatedItem._id
            ? updatedItem
            : currentItem
        )
      );

      Toast.show({
        type: 'success',
        text1: newStatus ? 'Item enabled' : 'Item unavailable',
        text2: `${item.name} ${
          newStatus
            ? 'is now available.'
            : 'has been marked unavailable.'
        }`,
      });
    } catch (error: any) {
      console.error('Update business menu item status error:', error);

      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to update menu item.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const formatPrice = (price: number) =>
    `Rs. ${Number(price || 0).toLocaleString('en-PK')}`;

  const availableCount = items.filter(
    (item) => item.isAvailable && isCategoryActive(item.category)
  ).length;

  const unavailableCount = items.length - availableCount;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back to business dashboard"
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color={colors.text}
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>RESTAURANT MANAGEMENT</Text>
          <Text style={styles.title}>Menu Items</Text>
          <Text style={styles.subtitle}>
            Manage what customers can order
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="fast-food-outline"
            size={23}
            color={colors.primary}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading menu items...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
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
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="options-outline"
                size={22}
                color={colors.secondary}
              />
            </View>

            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Availability controls</Text>
              <Text style={styles.infoText}>
                Turn an item on or off whenever needed. Menu details and
                prices are managed by the administrator.
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="restaurant-outline"
                  size={23}
                  color={colors.primary}
                />
              </View>
              <View style={styles.summaryHeading}>
                <Text style={styles.summaryTitle}>Your menu</Text>
                <Text style={styles.summaryCaption}>
                  Current item availability
                </Text>
              </View>
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <View
                  style={[
                    styles.statDot,
                    { backgroundColor: colors.secondary },
                  ]}
                />
                <Text style={styles.statLabel}>Available</Text>
                <Text style={styles.statValue}>{availableCount}</Text>
              </View>

              <View style={styles.statSeparator} />

              <View style={styles.summaryStat}>
                <View
                  style={[
                    styles.statDot,
                    { backgroundColor: colors.danger },
                  ]}
                />
                <Text style={styles.statLabel}>Unavailable</Text>
                <Text style={styles.statValue}>{unavailableCount}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>All menu items</Text>
              <Text style={styles.sectionSubtitle}>
                Switch items on or off below
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countText}>{items.length}</Text>
            </View>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="fast-food-outline"
                  size={32}
                  color={colors.textSecondary}
                />
              </View>

              <Text style={styles.emptyTitle}>No menu items yet</Text>
              <Text style={styles.emptyText}>
                Menu items created by the administrator will appear here.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.refreshEmptyButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => void handleRefresh()}
                disabled={refreshing}
              >
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color={colors.text}
                />
                <Text style={styles.refreshEmptyText}>Refresh menu</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.itemList}>
              {items.map((item) => {
                const categoryActive = isCategoryActive(item.category);
                const isUpdating = updatingId === item._id;
                const categoryName = getCategoryName(item.category);
                const effectiveAvailable =
                  item.isAvailable && categoryActive;

                return (
                  <View
                    key={item._id}
                    style={[
                      styles.itemCard,
                      !effectiveAvailable && styles.itemCardDisabled,
                    ]}
                  >
                    <View
                      style={[
                        styles.itemIcon,
                        effectiveAvailable
                          ? styles.itemIconAvailable
                          : styles.itemIconDisabled,
                      ]}
                    >
                      <Ionicons
                        name={
                          effectiveAvailable
                            ? 'fast-food'
                            : 'fast-food-outline'
                        }
                        size={23}
                        color={
                          effectiveAvailable
                            ? colors.secondary
                            : colors.textLight
                        }
                      />
                    </View>

                    <View style={styles.itemInfo}>
                      <Text
                        style={[
                          styles.itemName,
                          !effectiveAvailable && styles.itemNameDisabled,
                        ]}
                      >
                        {item.name}
                      </Text>

                      <Text
                        style={styles.categoryName}
                        numberOfLines={1}
                      >
                        {categoryName}
                      </Text>

                      {item.description ? (
                        <Text
                          style={styles.itemDescription}
                          numberOfLines={2}
                        >
                          {item.description}
                        </Text>
                      ) : null}

                      <View style={styles.priceRow}>
                        <Text style={styles.price}>
                          {formatPrice(
                            item.discountedPrice ?? item.price
                          )}
                        </Text>

                        {item.discountedPrice !== undefined &&
                          item.discountedPrice < item.price && (
                            <Text style={styles.originalPrice}>
                              {formatPrice(item.price)}
                            </Text>
                          )}
                      </View>

                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: effectiveAvailable
                                ? colors.secondary
                                : colors.danger,
                            },
                          ]}
                        />

                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: effectiveAvailable
                                ? colors.secondary
                                : colors.danger,
                            },
                          ]}
                        >
                          {!categoryActive
                            ? 'Category disabled'
                            : item.isAvailable
                              ? 'Available to order'
                              : 'Unavailable'}
                        </Text>
                      </View>

                      {!categoryActive && (
                        <Text style={styles.categoryWarning}>
                          Enable this category before enabling the item.
                        </Text>
                      )}
                    </View>

                    <View style={styles.switchContainer}>
                      {isUpdating ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                      ) : (
                        <Switch
                          value={item.isAvailable}
                          onValueChange={() => void handleToggle(item)}
                          disabled={!categoryActive || Boolean(updatingId)}
                          accessibilityLabel={`Make ${item.name} ${
                            item.isAvailable ? 'unavailable' : 'available'
                          }`}
                          trackColor={{
                            false: colors.border,
                            true: colors.primary,
                          }}
                          thumbColor={
                            item.isAvailable && categoryActive
                              ? colors.secondary
                              : colors.textLight
                          }
                        />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.footerNote}>
            <Ionicons
              name="information-circle-outline"
              size={17}
              color={colors.textLight}
            />
            <Text style={styles.footerNoteText}>
              Items in disabled categories cannot be enabled until the
              category is reactivated.
            </Text>
          </View>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  headerIcon: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryIcon: {
    width: 47,
    height: 47,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryHeading: {
    flex: 1,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  summaryCaption: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  totalBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  totalBadgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  statDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 'auto',
    marginRight: spacing.sm,
  },
  statSeparator: {
    width: 1,
    height: 27,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  sectionHeader: {
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
    minWidth: 34,
    height: 32,
    paddingHorizontal: 9,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '900',
  },
  itemList: {
    gap: spacing.md,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  itemCardDisabled: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  itemIcon: {
    width: 45,
    height: 45,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  itemIconAvailable: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  itemIconDisabled: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  itemInfo: {
    flex: 1,
    paddingTop: 1,
  },
  itemName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
  },
  itemNameDisabled: {
    color: colors.textSecondary,
  },
  categoryName: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  itemDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 9,
    gap: spacing.sm,
  },
  price: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  originalPrice: {
    color: colors.textLight,
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  categoryWarning: {
    color: colors.danger,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
  switchContainer: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -3,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: 42,
  },
  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
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
    marginTop: spacing.sm,
  },
  refreshEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  refreshEmptyText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  footerNoteText: {
    flex: 1,
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.75,
  },
});
