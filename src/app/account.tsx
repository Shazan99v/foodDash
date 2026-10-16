import React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import BottomNavigation from '../components/navigation/BottomNavigation';
import { colors, spacing, radius } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch {
      Alert.alert('Error', 'Unable to log out. Please try again.');
    }
  };

  const displayName = user?.name || 'Food Lover';
  const displayEmail = user?.email || 'No email available';

  const accountOptions = [
    {
      title: 'My Orders',
      subtitle: 'Track and manage your orders',
      icon: 'receipt-outline' as const,
      onPress: () => router.push('/orders'),
    },
    {
      title: 'My Addresses',
      subtitle: 'Manage your delivery locations',
      icon: 'location-outline' as const,
      onPress: () => router.push('/addresses'),
    },
    {
      title: 'My Profile',
      subtitle: 'Update your personal information',
      icon: 'person-outline' as const,
      onPress: () => router.push('/profile'),
    },
  ];

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>YOUR SPACE</Text>
              <Text style={styles.heading}>My Account</Text>
              <Text style={styles.headerSubtitle}>
                Everything you need, all in one place.
              </Text>
            </View>

            <View style={styles.headerIcon}>
              <Ionicons
                name="person-outline"
                size={24}
                color={colors.primary}
              />
            </View>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Ionicons
                  name="person"
                  size={32}
                  color={colors.primary}
                />
              </View>
              <View
                style={[
                  styles.avatarStatus,
                  !user && styles.guestAvatarStatus,
                ]}
              />
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileEyebrow}>
                {user ? 'WELCOME BACK' : 'WELCOME TO FOODDASH'}
              </Text>

              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>

              <Text style={styles.email} numberOfLines={2}>
                {displayEmail}
              </Text>

              <View
                style={[
                  styles.memberBadge,
                  !user && styles.guestBadge,
                ]}
              >
                <Ionicons
                  name={user ? 'checkmark-circle' : 'person-outline'}
                  size={13}
                  color={user ? colors.secondary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.memberText,
                    !user && styles.guestMemberText,
                  ]}
                >
                  {user ? 'Account active' : 'Guest account'}
                </Text>
              </View>
            </View>

            {user && (
              <Pressable
                style={({ pressed }) => [
                  styles.editButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push('/profile')}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={colors.text}
                />
              </Pressable>
            )}
          </View>

          {!user && (
            <View style={styles.signInCard}>
              <View style={styles.signInTop}>
                <View style={styles.signInIcon}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.signInContent}>
                  <Text style={styles.signInTitle}>
                    Your next great meal awaits
                  </Text>
                  <Text style={styles.signInDescription}>
                    Sign in to place orders, save delivery addresses,
                    and manage your account.
                  </Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.signInButton,
                  pressed && styles.primaryPressed,
                ]}
                onPress={() => router.push('/login')}
                accessibilityRole="button"
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.black}
                />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.registerButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push('/register')}
                accessibilityRole="button"
              >
                <Text style={styles.registerButtonText}>
                  New to FoodDash? Create an account
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.primary}
                />
              </Pressable>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Account Settings</Text>
              <Text style={styles.sectionSubtitle}>
                Manage your orders and personal details.
              </Text>
            </View>

            <View style={styles.sectionIcon}>
              <Ionicons
                name="settings-outline"
                size={19}
                color={colors.secondary}
              />
            </View>
          </View>

          <View style={styles.optionsCard}>
            {accountOptions.map((option, index) => (
              <React.Fragment key={option.title}>
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={option.onPress}
                  accessibilityRole="button"
                >
                  <View style={styles.optionIcon}>
                    <Ionicons
                      name={option.icon}
                      size={22}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>
                      {option.title}
                    </Text>
                    <Text style={styles.optionSubtitle}>
                      {option.subtitle}
                    </Text>
                  </View>

                  <View style={styles.chevronCircle}>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </View>
                </Pressable>

                {index < accountOptions.length - 1 && (
                  <View style={styles.separator} />
                )}
              </React.Fragment>
            ))}
          </View>

          {user && (
            <Pressable
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutPressed,
              ]}
              onPress={() => void handleLogout()}
              disabled={isLoading}
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color={colors.danger} />
              ) : (
                <>
                  <View style={styles.logoutIcon}>
                    <Ionicons
                      name="log-out-outline"
                      size={20}
                      color={colors.danger}
                    />
                  </View>
                  <Text style={styles.logoutText}>Log Out</Text>
                  <View style={styles.logoutSpacer} />
                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={colors.textLight}
                  />
                </>
              )}
            </Pressable>
          )}

          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Ionicons
              name="heart"
              size={13}
              color={colors.primary}
            />
            <Text style={styles.footerText}>
              Made with care for your next great meal.
            </Text>
            <View style={styles.footerLine} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  keyboardView: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 120,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },

  heading: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
  },

  headerIcon: {
    width: 49,
    height: 49,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },

  avatarWrap: {
    position: 'relative',
  },

  avatar: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 26, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 26, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarStatus: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    borderWidth: 3,
    borderColor: colors.surface,
  },

  guestAvatarStatus: {
    backgroundColor: colors.textLight,
  },

  profileInfo: {
    flex: 1,
    minWidth: 0,
  },

  profileEyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 4,
  },

  email: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },

  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(198, 245, 74, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(198, 245, 74, 0.20)',
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    gap: 5,
  },

  guestBadge: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },

  memberText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '800',
  },

  guestMemberText: {
    color: colors.textSecondary,
  },

  editButton: {
    width: 39,
    height: 39,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  signInCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },

  signInTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  signInIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 107, 26, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  signInContent: {
    flex: 1,
  },

  signInTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },

  signInDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },

  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },

  signInButtonText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900',
  },

  primaryPressed: {
    backgroundColor: colors.primaryDark,
  },

  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },

  registerButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 5,
  },

  sectionIcon: {
    width: 37,
    height: 37,
    borderRadius: radius.md,
    backgroundColor: 'rgba(198, 245, 74, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(198, 245, 74, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },

  option: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: spacing.md,
    borderRadius: radius.md,
  },

  optionPressed: {
    backgroundColor: colors.surfaceAlt,
  },

  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 107, 26, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 26, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },

  optionSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  chevronCircle: {
    width: 29,
    height: 29,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 58,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
  },

  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 98, 104, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900',
  },

  logoutSpacer: {
    flex: 1,
  },

  logoutPressed: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.danger,
  },

  pressed: {
    opacity: 0.72,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },

  footerLine: {
    flex: 1,
    maxWidth: 35,
    height: 1,
    backgroundColor: colors.border,
  },

  footerText: {
    color: colors.textLight,
    fontSize: 10,
    textAlign: 'center',
  },
});
