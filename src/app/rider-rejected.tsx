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
  danger: '#FF6268',
  border: '#343A3F',
};

export default function RiderRejectedScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { width } = useWindowDimensions();

  const isCompact = width < 380;

  const rejectionReason =
    user?.rejectionReason ||
    'No specific reason was provided. Please contact Food App support for more information.';

  const handleBackToLogin = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.container,
            isCompact && styles.compactContainer,
          ]}
        >
          <View style={styles.topLabel}>
            <View style={styles.brandMark}>
              <Ionicons
                name="bicycle"
                size={19}
                color={colors.secondary}
              />
            </View>

            <Text style={styles.brandName}>FOOD APP</Text>
          </View>

          <View style={styles.statusSection}>
            <View style={styles.iconOuter}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="close-circle"
                  size={43}
                  color={colors.danger}
                />
              </View>

              <View style={styles.statusBadge}>
                <Ionicons
                  name="alert"
                  size={13}
                  color={colors.background}
                />
              </View>
            </View>

            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                APPLICATION UPDATE
              </Text>
            </View>

            <Text style={styles.title}>
              Application Not Approved
            </Text>

            <Text style={styles.description}>
              Unfortunately, your rider application wasn't
              approved by the administrator. Review the
              information below to understand the decision.
            </Text>
          </View>

          <View style={styles.reasonCard}>
            <View style={styles.cardAccent} />

            <View style={styles.reasonHeader}>
              <View style={styles.reasonIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={21}
                  color={colors.danger}
                />
              </View>

              <View style={styles.reasonHeadingText}>
                <Text style={styles.cardEyebrow}>
                  APPLICATION STATUS
                </Text>

                <Text style={styles.reasonTitle}>
                  Rejection Reason
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <Text style={styles.reasonText}>
              {rejectionReason}
            </Text>
          </View>

          <View style={styles.supportCard}>
            <View style={styles.supportIcon}>
              <Ionicons
                name="headset-outline"
                size={22}
                color={colors.secondary}
              />
            </View>

            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>
                Need help?
              </Text>

              <Text style={styles.supportText}>
                Contact Food App support if you believe this
                decision was incorrect or need guidance about
                submitting a new application.
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log out and return to login"
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleBackToLogin}
          >
            <Ionicons
              name="log-in-outline"
              size={20}
              color={colors.background}
            />

            <Text style={styles.buttonText}>
              Back to Login
            </Text>

            <Ionicons
              name="arrow-forward"
              size={17}
              color={colors.background}
            />
          </Pressable>

          <View style={styles.footer}>
            <View style={styles.footerLine} />

            <Text style={styles.footerText}>
              YOUR NEXT CHAPTER STARTS HERE
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

  topLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginBottom: 35,
  },

  brandMark: {
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
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#FF626833',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusBadge: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: colors.danger,
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
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    marginBottom: 15,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },

  statusText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  title: {
    color: colors.text,
    fontSize: 25,
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

  reasonCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 19,
    overflow: 'hidden',
    position: 'relative',
  },

  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 18,
    bottom: 18,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.danger,
  },

  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  reasonIcon: {
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

  reasonHeadingText: {
    flex: 1,
  },

  cardEyebrow: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },

  reasonTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },

  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },

  reasonText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
  },

  supportCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 17,
    marginTop: 13,
  },

  supportIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#C6F54A12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  supportContent: {
    flex: 1,
  },

  supportTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },

  supportText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
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
    marginTop: 22,
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

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 25,
  },

  footerLine: {
    flex: 1,
    maxWidth: 45,
    height: 1,
    backgroundColor: colors.border,
  },

  footerText: {
    color: colors.textLight,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.1,
    textAlign: 'center',
  },
});