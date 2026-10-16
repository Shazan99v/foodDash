import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';

export default function HomeHeader() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const user = useAuthStore((state) => state.user);

  const [menuVisible, setMenuVisible] = useState(false);

  const isLoggedIn = Boolean(user);
  const isCompact = width < 360;

  const userInitial =
    user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  const headerTop = Math.max(insets.top + 8, 16);

  const handleLocationPress = () => {
    if (!isLoggedIn) {
      setMenuVisible(true);
      return;
    }

    router.push('/account');
  };

  const handleAccountPress = () => {
    if (isLoggedIn) {
      router.push('/account');
      return;
    }

    setMenuVisible(true);
  };

  const handleLogin = () => {
    setMenuVisible(false);
    router.push('/login');
  };

  const handleSignUp = () => {
    setMenuVisible(false);
    router.push('/register');
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingTop: headerTop,
          },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={
            isLoggedIn
              ? 'Open account and delivery address settings'
              : 'Log in to set your delivery location'
          }
          activeOpacity={0.78}
          style={styles.locationButton}
          onPress={handleLocationPress}
        >
          <View style={styles.locationIcon}>
            <Ionicons
              name="location"
              size={20}
              color={colors.primary}
            />
          </View>

          <View style={styles.locationText}>
            <Text style={styles.label}>DELIVER TO</Text>

            <View style={styles.locationRow}>
              <Text
                style={styles.location}
                numberOfLines={1}
              >
                {isLoggedIn
                  ? 'Choose delivery address'
                  : 'Login to set location'}
              </Text>

              <Ionicons
                name="chevron-down"
                size={15}
                color={colors.secondary}
              />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={
            isLoggedIn ? 'Open your account' : 'Login or create an account'
          }
          activeOpacity={0.8}
          style={styles.accountButton}
          onPress={handleAccountPress}
        >
          {user?.profilePhoto ? (
            <Image
              source={{ uri: user.profilePhoto }}
              style={styles.profileImage}
            />
          ) : isLoggedIn ? (
            <View style={styles.profileInitial}>
              <Text style={styles.profileInitialText}>
                {userInitial}
              </Text>
            </View>
          ) : (
            <View style={styles.guestAvatar}>
              <Ionicons
                name="person-outline"
                size={21}
                color={colors.text}
              />
            </View>
          )}

          {isLoggedIn && <View style={styles.onlineDot} />}
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable
            style={[
              styles.accountMenu,
              {
                top: headerTop + 64,
                right: spacing.lg,
                width: Math.min(300, width - spacing.xl * 2),
              },
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Ionicons
                  name="person-outline"
                  size={21}
                  color={colors.background}
                />
              </View>

              <View style={styles.menuHeaderText}>
                <Text style={styles.menuEyebrow}>
                  WELCOME TO FOODDASH
                </Text>

                <Text style={styles.menuTitle}>
                  Good food starts here.
                </Text>

                <Text style={styles.menuSubtitle}>
                  Sign in to manage your orders.
                </Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.75}
              style={styles.menuButton}
              onPress={handleLogin}
            >
              <View style={styles.menuIcon}>
                <Ionicons
                  name="log-in-outline"
                  size={20}
                  color={colors.secondary}
                />
              </View>

              <View style={styles.menuButtonText}>
                <Text style={styles.menuButtonTitle}>
                  Login
                </Text>

                <Text style={styles.menuButtonSubtitle}>
                  Sign in to your account
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={17}
                color={colors.textLight}
              />
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.75}
              style={styles.menuButton}
              onPress={handleSignUp}
            >
              <View style={styles.menuIcon}>
                <Ionicons
                  name="person-add-outline"
                  size={20}
                  color={colors.secondary}
                />
              </View>

              <View style={styles.menuButtonText}>
                <Text style={styles.menuButtonTitle}>
                  Create Account
                </Text>

                <Text style={styles.menuButtonSubtitle}>
                  Join and start ordering
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={17}
                color={colors.textLight}
              />
            </TouchableOpacity>

            <View style={styles.menuFooter}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={colors.secondary}
              />

              <Text style={styles.menuFooterText}>
                Your next favorite meal is waiting.
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  locationButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  locationText: {
    flex: 1,
    minWidth: 0,
  },

  label: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  location: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginRight: 4,
  },

  accountButton: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  guestAvatar: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileInitial: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileInitialText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '900',
  },

  profileImage: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
  },

  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: radius.round,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.background,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },

  accountMenu: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },

  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },

  menuAvatar: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  menuHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  menuEyebrow: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },

  menuTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },

  menuSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },

  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  menuButton: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },

  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  menuButtonText: {
    flex: 1,
    minWidth: 0,
  },

  menuButtonTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },

  menuButtonSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },

  menuFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  menuFooterText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
});