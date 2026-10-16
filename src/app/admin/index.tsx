import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../stores/authStore';
import { colors, radius, spacing } from '../../constants/theme';

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { width } = useWindowDimensions();

  const columnCount = width >= 900 ? 4 : width >= 600 ? 3 : 2;

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.log('ADMIN LOGOUT ERROR:', error);
    }
  };

  const managementItems = [
    {
      title: 'Restaurants',
      description: 'Add, edit and manage all restaurants',
      icon: 'storefront-outline' as const,
      route: '/admin/restaurants',
      accent: colors.primary,
    },
    {
      title: 'Menu Catalog',
      description: 'Manage categories, items and menu data',
      icon: 'fast-food-outline' as const,
      route: '/admin/catalog',
      accent: colors.secondary,
    },
    {
      title: 'Riders',
      description: 'View and manage delivery riders',
      icon: 'bicycle-outline' as const,
      route: '/admin/riders',
      accent: colors.honey,
    },
    {
      title: 'Orders',
      description: 'Monitor marketplace orders',
      icon: 'receipt-outline' as const,
      route: null,
      accent: colors.peach,
    },
  ];

  const applicationItems = [
    {
      title: 'Rider Applications',
      description: 'Review pending rider registrations',
      icon: 'bicycle-outline' as const,
      route: '/admin/rider-applications',
    },
    {
      title: 'Business Applications',
      description: 'Review pending restaurant owners',
      icon: 'storefront-outline' as const,
      route: '/admin/businesses',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrow}>FOODDASH ADMIN</Text>
            </View>

            <Text style={styles.title}>Dashboard</Text>

            <Text style={styles.subtitle}>
              Manage your marketplace from one place
            </Text>
          </View>

          <View style={styles.adminBadge}>
            <Ionicons
              name="shield-checkmark"
              size={15}
              color={colors.secondary}
            />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>

        <View style={styles.welcomeCard}>
          <View style={styles.welcomeAccent} />

          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>F</Text>
          </View>

          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeLabel}>WELCOME BACK</Text>

            <Text style={styles.welcomeTitle} numberOfLines={2}>
              {user?.name || 'Admin'}
            </Text>

            <Text style={styles.welcomeText}>
              Your admin account is active and ready.
            </Text>
          </View>

          <View style={styles.activeStatus}>
            <View style={styles.activeDot} />
            <Text style={styles.activeStatusText}>Active</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Management</Text>
            <Text style={styles.sectionSubtitle}>
              Control your marketplace
            </Text>
          </View>

          <View style={styles.sectionIcon}>
            <Ionicons
              name="grid-outline"
              size={18}
              color={colors.primary}
            />
          </View>
        </View>

        <View style={styles.grid}>
          {managementItems.map((item, index) => (
            <Pressable
              key={item.title}
              style={({ pressed }) => [
                styles.card,
                {
                  width: `${100 / columnCount - 2}%`,
                  borderTopColor: item.accent,
                },
                pressed && styles.cardPressed,
              ]}
              onPress={() => {
                if (item.route) {
                  router.push(item.route as any);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              accessibilityHint={
                item.route
                  ? `Open ${item.title} management`
                  : 'Orders navigation is not configured yet'
              }
            >
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.cardIconBox,
                    {
                      backgroundColor:
                        index === 1
                          ? 'rgba(198, 245, 74, 0.10)'
                          : index === 2
                            ? 'rgba(255, 181, 71, 0.10)'
                            : index === 3
                              ? 'rgba(255, 149, 102, 0.10)'
                              : 'rgba(255, 107, 26, 0.12)',
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={23}
                    color={item.accent}
                  />
                </View>

                {item.route ? (
                  <Ionicons
                    name="arrow-up-forward-outline"
                    size={17}
                    color={colors.textLight}
                  />
                ) : (
                  <View style={styles.comingSoonBadge}>
                    <View style={styles.comingSoonDot} />
                    <Text style={styles.comingSoonText}>Soon</Text>
                  </View>
                )}
              </View>

              <Text style={styles.cardTitle}>{item.title}</Text>

              <Text style={styles.cardDescription}>
                {item.description}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={[styles.cardAction, { color: item.accent }]}>
                  {item.route ? 'Open section' : 'Not configured'}
                </Text>
                {item.route ? (
                  <Ionicons
                    name="chevron-forward"
                    size={15}
                    color={item.accent}
                  />
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Applications</Text>
            <Text style={styles.sectionSubtitle}>
              Review new partner registrations
            </Text>
          </View>

          <View style={styles.sectionIcon}>
            <Ionicons
              name="documents-outline"
              size={18}
              color={colors.secondary}
            />
          </View>
        </View>

        <View style={styles.applicationCard}>
          {applicationItems.map((item, index) => (
            <React.Fragment key={item.title}>
              {index > 0 && <View style={styles.divider} />}

              <Pressable
                style={({ pressed }) => [
                  styles.applicationRow,
                  pressed && styles.applicationRowPressed,
                ]}
                onPress={() => router.push(item.route as any)}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                <View style={styles.applicationIcon}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.applicationContent}>
                  <Text style={styles.applicationTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.applicationText}>
                    {item.description}
                  </Text>
                </View>

                <View style={styles.applicationArrow}>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
              </Pressable>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={colors.secondary}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Admin responsibilities
            </Text>

            <Text style={styles.infoText}>
              The admin controls the master restaurant catalog. Restaurants
              can manage operational availability and stock status, but
              cannot change catalog information such as item names, prices,
              or images.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <View style={styles.logoutIcon}>
            <Ionicons
              name="log-out-outline"
              size={22}
              color={colors.danger}
            />
          </View>

          <View style={styles.logoutContent}>
            <Text style={styles.logoutTitle}>Logout</Text>
            <Text style={styles.logoutText}>
              Sign out of the admin account
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.danger}
          />
        </Pressable>

        <Text style={styles.footerText}>
          FOODDASH · ADMIN CONSOLE
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

  container: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingBottom: 48,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },

  headerText: {
    flex: 1,
    marginRight: spacing.md,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 8,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.7,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },

  adminBadgeText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  welcomeCard: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },

  welcomeAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
  },

  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  iconText: {
    color: colors.black,
    fontSize: 26,
    fontWeight: '900',
  },

  welcomeContent: {
    flex: 1,
    minWidth: 0,
  },

  welcomeLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 4,
  },

  welcomeTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },

  welcomeText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(198, 245, 74, 0.08)',
    borderRadius: radius.round,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginLeft: spacing.sm,
  },

  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    marginRight: 6,
  },

  activeStatusText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '800',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: colors.textLight,
    fontSize: 12,
    marginTop: 4,
  },

  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },

  card: {
    minWidth: 145,
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 178,
  },

  cardPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: radius.round,
  },

  comingSoonDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.textLight,
    marginRight: 5,
  },

  comingSoonText: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
  },

  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 6,
  },

  cardDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    flex: 1,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  cardAction: {
    fontSize: 10,
    fontWeight: '900',
  },

  applicationCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },

  applicationRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },

  applicationRowPressed: {
    opacity: 0.65,
  },

  applicationIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 107, 26, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  applicationContent: {
    flex: 1,
    minWidth: 0,
  },

  applicationTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 5,
  },

  applicationText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  applicationArrow: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    marginLeft: spacing.sm,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(198, 245, 74, 0.09)',
    marginRight: spacing.md,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 7,
  },

  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },

  logoutButton: {
    minHeight: 76,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },

  logoutButtonPressed: {
    opacity: 0.65,
  },

  logoutIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 98, 104, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  logoutContent: {
    flex: 1,
  },

  logoutTitle: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },

  logoutText: {
    color: colors.textSecondary,
    fontSize: 11,
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
