import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';

const tabs = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    activeIcon: 'home' as const,
    inactiveIcon: 'home-outline' as const,
  },
  {
    id: 'explore',
    label: 'Explore',
    path: '/explore',
    activeIcon: 'compass' as const,
    inactiveIcon: 'compass-outline' as const,
  },
  {
    id: 'deals',
    label: 'Deals',
    path: '/deals',
    activeIcon: 'pricetag' as const,
    inactiveIcon: 'pricetag-outline' as const,
  },
  {
    id: 'cart',
    label: 'Cart',
    path: '/cart',
    activeIcon: 'bag' as const,
    inactiveIcon: 'bag-outline' as const,
  },
  {
    id: 'account',
    label: 'Account',
    path: '/account',
    activeIcon: 'person' as const,
    inactiveIcon: 'person-outline' as const,
  },
];

export default function BottomNavigation() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;

  const getActiveTab = () => {
    if (pathname === '/' || pathname === '/index') {
      return 'home';
    }

    if (
      pathname === '/explore' ||
      pathname.startsWith('/explore/')
    ) {
      return 'explore';
    }

    if (
      pathname === '/deals' ||
      pathname.startsWith('/deals/')
    ) {
      return 'deals';
    }

    if (
      pathname === '/cart' ||
      pathname.startsWith('/cart/')
    ) {
      return 'cart';
    }

    if (
      pathname === '/account' ||
      pathname.startsWith('/account/') ||
      pathname === '/profile' ||
      pathname === '/addresses' ||
      pathname === '/phone-numbers' ||
      pathname === '/orders' ||
      pathname.startsWith('/orders/')
    ) {
      return 'account';
    }

    return null;
  };

  const activeTab = getActiveTab();

  const hiddenRoutes = [
    '/login',
    '/register',
    '/profile',
    '/addresses',
    '/phone-numbers',
    '/orders',
  ];

  const shouldHide =
    hiddenRoutes.some(
      (path) =>
        pathname === path ||
        pathname.startsWith(`${path}/`)
    ) ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/business/') ||
    pathname.startsWith('/rider/') ||
    pathname === '/business-pending' ||
    pathname === '/business-rejected' ||
    pathname === '/rider-pending' ||
    pathname === '/rider-rejected';

  if (shouldHide) {
    return null;
  }

  const handleTabPress = (path: string) => {
    if (path === pathname) {
      return;
    }

    router.push(path as never);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          paddingBottom: Math.max(
            insets.bottom,
            spacing.sm
          ),
          paddingHorizontal: isDesktop
            ? spacing.xxl
            : spacing.md,
        },
      ]}
    >
      <View
        style={[
          styles.navigation,
          isDesktop && styles.navigationDesktop,
        ]}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              activeOpacity={0.75}
              onPress={() => handleTabPress(tab.path)}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{
                selected: isActive,
              }}
            >
              <View
                style={[
                  styles.iconWrapper,
                  isActive && styles.activeIconWrapper,
                ]}
              >
                <Ionicons
                  name={
                    isActive
                      ? tab.activeIcon
                      : tab.inactiveIcon
                  }
                  size={22}
                  color={
                    isActive
                      ? colors.secondary
                      : colors.textSecondary
                  }
                />
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  isActive && styles.activeLabel,
                ]}
              >
                {tab.label}
              </Text>

              {isActive && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.sm,
    backgroundColor: 'transparent',
  },

  navigation: {
    width: '100%',
    maxWidth: 560,
    minHeight: 72,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 12,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 -5px 24px rgba(0, 0, 0, 0.20)',
        }
      : {}),
  },

  navigationDesktop: {
    maxWidth: 620,
  },

  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    gap: 2,
  },

  iconWrapper: {
    width: 42,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeIconWrapper: {
    backgroundColor: colors.primaryDark,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },

  activeLabel: {
    color: colors.secondary,
    fontWeight: '800',
  },

  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 16,
    height: 3,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
});