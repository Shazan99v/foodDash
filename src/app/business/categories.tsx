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
  type BusinessMenuCategory,
  getMyCategories,
  updateMyCategoryStatus,
} from '../../services/business/businessApi';
import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';

export default function BusinessCategoriesScreen() {
  const [categories, setCategories] = useState<BusinessMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  const loadCategories = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setLoadError('');

      const data = await getMyCategories();
      setCategories(data);
    } catch (error: any) {
      console.error('Load business categories error:', error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load categories. Please try again.';

      setLoadError(message);

      Toast.show({
        type: 'error',
        text1: 'Unable to load categories',
        text2: message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCategories();
    }, [loadCategories])
  );

  const handleRefresh = async () => {
    if (refreshing || updatingId) return;

    setRefreshing(true);
    await loadCategories(false);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/business');
    }
  };

  const handleToggle = async (category: BusinessMenuCategory) => {
    if (updatingId) return;

    const nextIsActive = !category.isActive;
    const categoryId = category._id;

    setUpdatingId(categoryId);

    setCategories((current) =>
      current.map((item) =>
        item._id === categoryId
          ? { ...item, isActive: nextIsActive }
          : item
      )
    );

    try {
      const updatedCategory = await updateMyCategoryStatus(
        categoryId,
        nextIsActive
      );

      setCategories((current) =>
        current.map((item) =>
          item._id === categoryId ? updatedCategory : item
        )
      );

      Toast.show({
        type: 'success',
        text1: nextIsActive ? 'Category enabled' : 'Category disabled',
        text2: nextIsActive
          ? `${category.name} is now available.`
          : `${category.name} is now unavailable.`,
      });
    } catch (error: any) {
      console.error('Update business category status error:', error);

      setCategories((current) =>
        current.map((item) =>
          item._id === categoryId
            ? { ...item, isActive: category.isActive }
            : item
        )
      );

      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Could not update category availability.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const activeCount = categories.filter((item) => item.isActive).length;

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
          accessibilityLabel="Back to business dashboard"
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>RESTAURANT MANAGEMENT</Text>
          <Text style={styles.title}>Menu Categories</Text>
          <Text style={styles.subtitle}>Manage category availability</Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="grid-outline" size={22} color={colors.primary} />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <View style={styles.loadingIcon}>
            <Ionicons
              name="grid-outline"
              size={29}
              color={colors.primary}
            />
          </View>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingTitle}>Loading categories</Text>
          <Text style={styles.loadingText}>Please wait...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={colors.secondary}
              />
            </View>

            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Availability only</Text>
              <Text style={styles.infoText}>
                Admin manages category names and details. You can only enable
                or disable categories for your restaurant.
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{categories.length}</Text>
              <Text style={styles.summaryLabel}>Total categories</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.enabledValue]}>
                {activeCount}
              </Text>
              <Text style={styles.summaryLabel}>Enabled</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.disabledValue]}>
                {categories.length - activeCount}
              </Text>
              <Text style={styles.summaryLabel}>Disabled</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Your categories</Text>
              <Text style={styles.sectionSubtitle}>
                Control what customers can browse
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countText}>{categories.length}</Text>
            </View>
          </View>

          {!!loadError && (
            <View style={styles.errorCard}>
              <View style={styles.errorIcon}>
                <Ionicons
                  name="alert-circle-outline"
                  size={21}
                  color={colors.danger}
                />
              </View>

              <View style={styles.errorContent}>
                <Text style={styles.errorTitle}>
                  Could not load categories
                </Text>
                <Text style={styles.errorText}>{loadError}</Text>

                <Pressable
                  onPress={() => void loadCategories()}
                  style={({ pressed }) => [
                    styles.retryButton,
                    pressed && styles.pressed,
                  ]}
                  disabled={loading}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!loadError && categories.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="restaurant-outline"
                  size={30}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={styles.emptyTitle}>No categories yet</Text>
              <Text style={styles.emptyText}>
                Categories created by the admin will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.categoryList}>
              {categories.map((category) => {
                const isUpdating = updatingId === category._id;
                const enabled = category.isActive;

                return (
                  <View
                    key={category._id}
                    style={[
                      styles.categoryCard,
                      !enabled && styles.categoryCardDisabled,
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        enabled && styles.categoryIconEnabled,
                      ]}
                    >
                      <Ionicons
                        name={enabled ? 'restaurant' : 'restaurant-outline'}
                        size={22}
                        color={enabled ? colors.primary : colors.textLight}
                      />
                    </View>

                    <View style={styles.categoryInfo}>
                      <Text
                        style={[
                          styles.categoryName,
                          !enabled && styles.categoryNameDisabled,
                        ]}
                      >
                        {category.name}
                      </Text>

                      {!!category.description && (
                        <Text
                          style={styles.categoryDescription}
                          numberOfLines={2}
                        >
                          {category.description}
                        </Text>
                      )}

                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: enabled
                                ? colors.secondary
                                : colors.danger,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: enabled
                                ? colors.secondary
                                : colors.danger,
                            },
                          ]}
                        >
                          {enabled ? 'Available to customers' : 'Unavailable'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.switchContainer}>
                      {isUpdating ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                      ) : (
                        <Switch
                          value={enabled}
                          onValueChange={() => void handleToggle(category)}
                          disabled={!!updatingId || refreshing}
                          accessibilityRole="switch"
                          accessibilityLabel={`${
                            enabled ? 'Disable' : 'Enable'
                          } ${category.name}`}
                          trackColor={{
                            false: colors.border,
                            true: colors.secondary,
                          }}
                          thumbColor={
                            enabled ? colors.primary : colors.textSecondary
                          }
                          ios_backgroundColor={colors.border}
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
              size={18}
              color={colors.primary}
            />
            <Text style={styles.footerText}>
              Disabling a category should prevent its items from being ordered.
              Availability is saved through the server.
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl + spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 5,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xxl,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
  },
  enabledValue: {
    color: colors.secondary,
  },
  disabledValue: {
    color: colors.danger,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 35,
    backgroundColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
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
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  countText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '900',
  },
  categoryList: {
    gap: spacing.md,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  categoryCardDisabled: {
    backgroundColor: colors.background,
    opacity: 0.86,
  },
  categoryIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconEnabled: {
    backgroundColor: '#30251F',
    borderWidth: 1,
    borderColor: '#65402D',
  },
  categoryInfo: {
    flex: 1,
    minWidth: 0,
  },
  categoryName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  categoryNameDisabled: {
    color: colors.textSecondary,
  },
  categoryDescription: {
    color: colors.textLight,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: radius.round,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  switchContainer: {
    width: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  loadingIcon: {
    width: 66,
    height: 66,
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
    fontWeight: '900',
    marginTop: spacing.lg,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
  errorCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContent: {
    flex: 1,
    minWidth: 0,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingVertical: 5,
  },
  retryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingHorizontal: 3,
  },
  footerText: {
    flex: 1,
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.72,
  },
});
