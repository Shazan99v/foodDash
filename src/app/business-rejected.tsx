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

import { colors, radius, spacing } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';

export default function BusinessRejectedScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const rejectionReason =
    user?.rejectionReason ||
    'No specific reason was provided. Please contact FoodDash support for more information.';

  const handleBackToLogin = async () => {
    await logout();
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

          <View style={styles.statusSection}>
            <View style={styles.iconGlow}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="close-circle"
                  size={54}
                  color={colors.danger}
                />
              </View>
            </View>

            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>
                APPLICATION NOT APPROVED
              </Text>
            </View>

            <Text style={styles.title}>
              Business Application{'\n'}
              <Text style={styles.titleAccent}>Not Approved</Text>
            </Text>

            <Text style={styles.description}>
              Unfortunately, your business application was not approved
              by the administrator. Review the reason below for more
              information.
            </Text>
          </View>

          <View style={styles.reasonCard}>
            <View style={styles.cardHeader}>
              <View style={styles.reasonIcon}>
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color={colors.danger}
                />
              </View>

              <View style={styles.reasonHeading}>
                <Text style={styles.cardEyebrow}>
                  APPLICATION REVIEW
                </Text>
                <Text style={styles.reasonTitle}>
                  Rejection Reason
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <Text style={styles.reasonText}>
              {rejectionReason}
            </Text>
          </View>

          <View style={styles.helpCard}>
            <View style={styles.helpIcon}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={22}
                color={colors.secondary}
              />
            </View>

            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Need help?</Text>

              <Text style={styles.helpText}>
                Contact FoodDash support if you need clarification
                about this decision or guidance on submitting a
                new application.
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Login"
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleBackToLogin}
          >
            <Ionicons
              name="log-in-outline"
              size={21}
              color={colors.black}
            />

            <Text style={styles.buttonText}>
              Back to Login
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.black}
            />
          </Pressable>

          <View style={styles.footer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color={colors.textLight}
            />
            <Text style={styles.footerText}>
              Your application status is managed securely.
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

  statusSection: {
    alignItems: 'center',
  },

  iconGlow: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(255, 98, 104, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },

  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 98, 104, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: 'rgba(255, 98, 104, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 98, 104, 0.22)',
    marginBottom: spacing.lg,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },

  statusBadgeText: {
    color: colors.danger,
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
    color: colors.danger,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 370,
    marginBottom: spacing.xl,
  },

  reasonCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 98, 104, 0.30)',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing.sm,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  reasonIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 98, 104, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  reasonHeading: {
    flex: 1,
  },

  cardEyebrow: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },

  reasonTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },

  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },

  reasonText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 23,
  },

  helpCard: {
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

  helpIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: 'rgba(198, 245, 74, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  helpContent: {
    flex: 1,
  },

  helpTitle: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },

  helpText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
  },

  button: {
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

  buttonPressed: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.99 }],
  },

  buttonText: {
    flex: 1,
    color: colors.black,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
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
