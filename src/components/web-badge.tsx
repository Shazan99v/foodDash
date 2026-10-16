import { version } from 'expo/package.json';
import { Image } from 'expo-image';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { colors, radius, spacing } from '@/constants/theme';

export function WebBadge() {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  return (
    <ThemedView
      style={[styles.container, isCompact && styles.compactContainer]}
    >
      <View style={styles.versionBadge}>
        <View style={styles.statusDot} />
        <ThemedText
          type="code"
          themeColor="textSecondary"
          style={styles.versionText}
        >
          FoodDash · v{version}
        </ThemedText>
      </View>

      <View style={styles.brandBadge}>
        <View style={styles.brandIcon}>
          <Image
            source={require('@/assets/images/expo-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <View style={styles.brandTextContainer}>
          <ThemedText style={styles.brandName}>FoodDash</ThemedText>
          <ThemedText style={styles.brandCaption}>
            FOOD, WITHOUT THE WAIT
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },

  compactContainer: {
    paddingHorizontal: spacing.sm,
  },

  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: radius.round,
    backgroundColor: colors.secondary,
  },

  versionText: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },

  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: 26,
    height: 26,
  },

  brandTextContainer: {
    gap: spacing.xs,
  },

  brandName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  brandCaption: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
});