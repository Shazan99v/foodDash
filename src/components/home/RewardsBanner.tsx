import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';

export default function RewardsBanner() {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  const handleExploreBenefits = () => {
    router.push('/deals');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.banner, isCompact && styles.compactBanner]}>
        <View style={styles.orangeRail} />
        <View style={styles.decorativeCircleLarge} />
        <View style={styles.decorativeCircleSmall} />

        <View style={styles.iconColumn}>
          <View style={styles.iconGlow}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="trophy"
                size={28}
                color={colors.secondary}
              />
            </View>
          </View>

          <View style={styles.sparkleIcon}>
            <Ionicons
              name="sparkles"
              size={15}
              color={colors.primary}
            />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />

            <Text style={styles.badgeText}>
              MEMBER PERKS
            </Text>

            <Ionicons
              name="sparkles"
              size={12}
              color={colors.secondary}
            />
          </View>

          <Text style={styles.title}>
            Make every order
          </Text>

          <Text style={styles.titleAccent}>
            more rewarding.
          </Text>

          <Text style={styles.description}>
            Discover exclusive deals, tasty rewards and free delivery offers.
          </Text>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Explore rewards and deals"
            style={styles.button}
            activeOpacity={0.82}
            onPress={handleExploreBenefits}
          >
            <Text style={styles.buttonText}>
              Explore Benefits
            </Text>

            <View style={styles.buttonIcon}>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={colors.background}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.cornerLabel}>
          <Ionicons
            name="gift-outline"
            size={13}
            color={colors.secondary}
          />
          <Text style={styles.cornerLabelText}>EXTRA GOODNESS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },

  banner: {
    minHeight: 220,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },

  compactBanner: {
    paddingHorizontal: spacing.md,
    minHeight: 218,
  },

  orangeRail: {
    position: 'absolute',
    left: 0,
    top: 24,
    bottom: 24,
    width: 4,
    borderTopRightRadius: radius.round,
    borderBottomRightRadius: radius.round,
    backgroundColor: colors.primary,
  },

  iconColumn: {
    width: 66,
    alignSelf: 'flex-start',
    marginTop: 35,
    marginRight: spacing.md,
    alignItems: 'center',
    zIndex: 2,
  },

  iconGlow: {
    width: 62,
    height: 62,
    borderRadius: radius.lg,
    backgroundColor: '#FF6B1A18',
    borderWidth: 1,
    borderColor: '#FF6B1A45',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sparkleIcon: {
    width: 29,
    height: 29,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },

  content: {
    flex: 1,
    minWidth: 0,
    zIndex: 2,
    paddingVertical: spacing.sm,
  },

  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.round,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },

  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: colors.secondary,
  },

  title: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.3,
  },

  titleAccent: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.4,
  },

  description: {
    fontSize: 10,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    maxWidth: 240,
  },

  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.secondary,
    paddingLeft: spacing.md,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: radius.round,
  },

  buttonText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.background,
  },

  buttonIcon: {
    width: 27,
    height: 27,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  decorativeCircleLarge: {
    position: 'absolute',
    right: -55,
    top: -65,
    width: 170,
    height: 170,
    borderRadius: 100,
    backgroundColor: '#FF6B1A0C',
    borderWidth: 1,
    borderColor: '#FF6B1A1F',
  },

  decorativeCircleSmall: {
    position: 'absolute',
    right: 20,
    bottom: -47,
    width: 100,
    height: 100,
    borderRadius: 100,
    backgroundColor: '#C6F54A12',
    borderWidth: 1,
    borderColor: '#C6F54A25',
  },

  cornerLabel: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 1,
  },

  cornerLabelText: {
    color: colors.textLight,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
});