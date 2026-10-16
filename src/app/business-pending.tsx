import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  colors,
  radius,
  spacing,
} from '../constants/theme';
import { removeAuthToken } from '../services/auth/authStorage';

export default function BusinessPendingScreen() {
  const handleBackHome = async () => {
    await removeAuthToken();
    router.replace('/');
  };

  const handleSignIn = async () => {
    await removeAuthToken();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Ionicons
                name="restaurant"
                size={21}
                color={colors.primary}
              />
            </View>

            <Text style={styles.brandText}>
              Food<Text style={styles.brandAccent}>Dash</Text>
            </Text>
          </View>

          <View style={styles.hero}>
            <View style={styles.iconGlow}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="time-outline"
                  size={48}
                  color={colors.secondary}
                />
              </View>
            </View>

            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                AWAITING APPROVAL
              </Text>
            </View>

            <Text style={styles.title}>
              Your Business Is{'\n'}
              <Text style={styles.titleAccent}>Under Review</Text>
            </Text>

            <Text style={styles.description}>
              Your application has been submitted successfully.
              Our admin team will review your details before
              activating your restaurant.
            </Text>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                Application status
              </Text>
              <Text style={styles.progressLabel}>
                In progress
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>

            <View style={styles.timeline}>
              <View style={styles.timelineItem}>
                <View style={styles.timelineIconComplete}>
                  <Ionicons
                    name="checkmark"
                    size={17}
                    color={colors.black}
                  />
                </View>

                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>
                    Application submitted
                  </Text>
                  <Text style={styles.timelineDescription}>
                    Your application has been received.
                  </Text>
                </View>

                <Text style={styles.timelineStatus}>
                  DONE
                </Text>
              </View>

              <View style={styles.timelineConnector} />

              <View style={styles.timelineItem}>
                <View style={styles.timelineIconPending}>
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color={colors.secondary}
                  />
                </View>

                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>
                    Admin review
                  </Text>
                  <Text style={styles.timelineDescription}>
                    Your application is awaiting a decision.
                  </Text>
                </View>

                <Text style={styles.pendingLabel}>
                  PENDING
                </Text>
              </View>

              <View style={styles.timelineConnector} />

              <View style={styles.timelineItem}>
                <View style={styles.timelineIconFuture}>
                  <Ionicons
                    name="storefront-outline"
                    size={17}
                    color={colors.textLight}
                  />
                </View>

                <View style={styles.timelineContent}>
                  <Text style={styles.futureTitle}>
                    Restaurant activation
                  </Text>
                  <Text style={styles.timelineDescription}>
                    Available after your application is approved.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="rocket-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>
                What happens after approval?
              </Text>

              <Text style={styles.infoText}>
                Your restaurant will be created automatically.
                You will then get access to your business
                dashboard to manage orders, restaurant
                availability, operating hours, and menu
                category and item availability.
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={handleBackHome}
          >
            <Ionicons
              name="home-outline"
              size={20}
              color={colors.black}
            />

            <Text style={styles.primaryButtonText}>
              Back to Home
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.black}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
            onPress={handleSignIn}
          >
            <Ionicons
              name="log-in-outline"
              size={19}
              color={colors.text}
            />

            <Text style={styles.secondaryButtonText}>
              Sign In Again
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color={colors.textLight}
            />

            <Text style={styles.footerText}>
              Thank you for choosing FoodDash.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },

  container: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxxl,
  },

  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandText: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  brandAccent: {
    color: colors.primary,
  },

  hero: {
    alignItems: 'center',
  },

  iconGlow: {
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: 'rgba(198, 245, 74, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(198, 245, 74, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(198, 245, 74, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(198, 245, 74, 0.22)',
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },

  statusText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  title: {
    color: colors.text,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.8,
    marginBottom: spacing.md,
  },

  titleAccent: {
    color: colors.secondary,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 370,
    marginBottom: spacing.xl,
  },

  progressCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing.sm,
  },

  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  progressTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },

  progressLabel: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '800',
  },

  progressTrack: {
    height: 5,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.round,
    overflow: 'hidden',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },

  progressFill: {
    width: '58%',
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: radius.round,
  },

  timeline: {
    gap: spacing.xs,
  },

  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  timelineIconComplete: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timelineIconPending: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(198, 245, 74, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(198, 245, 74, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  timelineIconFuture: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timelineContent: {
    flex: 1,
  },

  timelineTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },

  futureTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },

  timelineDescription: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 17,
  },

  timelineStatus: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  pendingLabel: {
    color: colors.honey,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  timelineConnector: {
    width: 1,
    height: 17,
    backgroundColor: colors.border,
    marginLeft: 16,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 107, 26, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },

  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 20,
  },

  primaryButton: {
    minHeight: 56,
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },

  primaryButtonPressed: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.99 }],
  },

  primaryButtonText: {
    flex: 1,
    color: colors.black,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },

  secondaryButton: {
    minHeight: 52,
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  secondaryButtonPressed: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.primary,
    transform: [{ scale: 0.99 }],
  },

  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },

  footerText: {
    color: colors.textLight,
    fontSize: 11,
    textAlign: 'center',
  },
});
