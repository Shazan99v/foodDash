import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../stores/authStore';

const colors = {
  primary: '#FF6B1A',
  primaryDark: '#E8520C',
  secondary: '#C6F54A',
  background: '#111315',
  surface: '#1B1E21',
  surfaceAlt: '#25292D',
  text: '#F5F5F0',
  textSecondary: '#B8BEC3',
  textLight: '#858D94',
  border: '#343A3F',
};

export default function RiderPendingScreen() {
  const logout = useAuthStore((state) => state.logout);
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  const handleBackToHome = async () => {
    await logout();
    router.replace('/');
  };

  const handleSignInAgain = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.container,
            isCompact && styles.compactContainer,
          ]}
        >
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Ionicons
                name="bicycle"
                size={20}
                color={colors.secondary}
              />
            </View>

            <Text style={styles.brandName}>FOOD APP</Text>
          </View>

          <View style={styles.statusSection}>
            <View style={styles.iconOuter}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="time-outline"
                  size={43}
                  color={colors.secondary}
                />
              </View>

              <View style={styles.iconBadge}>
                <Ionicons
                  name="hourglass-outline"
                  size={14}
                  color={colors.background}
                />
              </View>
            </View>

            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusLabel}>
                UNDER REVIEW
              </Text>
            </View>

            <Text style={styles.title}>
              Application Pending
            </Text>

            <Text style={styles.description}>
              Your rider application has been submitted
              successfully. Our team is reviewing your
              information before activating your account.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Ionicons
                  name="clipboard-outline"
                  size={21}
                  color={colors.primary}
                />
              </View>

              <View style={styles.cardHeading}>
                <Text style={styles.cardEyebrow}>
                  YOUR APPLICATION
                </Text>

                <Text style={styles.cardTitle}>
                  What happens next?
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={colors.secondary}
                />
              </View>

              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  Information review
                </Text>

                <Text style={styles.stepDescription}>
                  An administrator checks your personal
                  details, vehicle information and documents.
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={colors.secondary}
                />
              </View>

              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  Account activation
                </Text>

                <Text style={styles.stepDescription}>
                  Once approved, your rider account becomes
                  active and you can access your dashboard.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.note}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={colors.textLight}
            />

            <Text style={styles.noteText}>
              Your application is still being reviewed.
              Please check back later for updates.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleBackToHome}
          >
            <Ionicons
              name="home-outline"
              size={19}
              color={colors.background}
            />

            <Text style={styles.buttonText}>
              Back to Home
            </Text>

            <Ionicons
              name="arrow-forward"
              size={17}
              color={colors.background}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutPressed,
            ]}
            onPress={handleSignInAgain}
          >
            <Ionicons
              name="log-in-outline"
              size={17}
              color={colors.textSecondary}
            />

            <Text style={styles.logoutText}>
              Sign In Again
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <View style={styles.footerLine} />

            <Text style={styles.footerText}>
              THANK YOU FOR YOUR PATIENCE
            </Text>

            <View style={styles.footerLine} />
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
    paddingVertical: 28,
  },

  container: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 28,
  },

  compactContainer: {
    paddingHorizontal: 20,
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginBottom: 32,
  },

  brandIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },

  statusSection: {
    alignItems: 'center',
  },

  iconOuter: {
    width: 98,
    height: 98,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 19,
  },

  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 29,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#C6F54A30',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.secondary,
    borderWidth: 4,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 15,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },

  statusLabel: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 12,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 370,
    marginBottom: 27,
  },

  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 19,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  cardHeading: {
    flex: 1,
  },

  cardEyebrow: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },

  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },

  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepContent: {
    flex: 1,
    paddingTop: 1,
  },

  stepTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 5,
  },

  stepDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },

  stepConnector: {
    height: 18,
    width: 1,
    backgroundColor: colors.border,
    marginLeft: 17,
    marginVertical: 4,
  },

  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 16,
    paddingHorizontal: 4,
  },

  noteText: {
    flex: 1,
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 18,
  },

  button: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    marginTop: 24,
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  buttonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
    textAlign: 'center',
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    marginTop: 7,
  },

  logoutPressed: {
    opacity: 0.65,
  },

  logoutText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 19,
  },

  footerLine: {
    flex: 1,
    maxWidth: 36,
    height: 1,
    backgroundColor: colors.border,
  },

  footerText: {
    color: colors.textLight,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
});