import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { colors, radius, spacing } from '@/constants/theme';

export function Collapsible({
  children,
  title,
}: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  return (
    <ThemedView style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.heading,
          isCompact && styles.compactHeading,
          isOpen && styles.openHeading,
          pressed && styles.pressedHeading,
        ]}
        onPress={() => setIsOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: isOpen }}
      >
        <View style={[styles.iconBox, isOpen && styles.iconBoxOpen]}>
          <Ionicons
            name={isOpen ? 'chevron-down' : 'chevron-forward'}
            size={17}
            color={isOpen ? colors.secondary : colors.primary}
          />
        </View>

        <View style={styles.titleContainer}>
          <ThemedText type="small" style={styles.title}>
            {title}
          </ThemedText>
        </View>

        <View style={[styles.statusBadge, isOpen && styles.statusBadgeOpen]}>
          <ThemedText style={styles.statusText}>
            {isOpen ? 'OPEN' : 'VIEW'}
          </ThemedText>
        </View>
      </Pressable>

      {isOpen && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <ThemedView
            type="backgroundElement"
            style={styles.content}
          >
            <View style={styles.contentAccent} />
            <View style={styles.contentInner}>
              {children}
            </View>
          </ThemedView>
        </Animated.View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  heading: {
    width: '100%',
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  compactHeading: {
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },

  openHeading: {
    borderColor: colors.primary,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },

  pressedHeading: {
    opacity: 0.82,
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1,
    borderColor: `${colors.primary}55`,
  },

  iconBoxOpen: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primary,
  },

  titleContainer: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    color: colors.text,
    fontWeight: '700',
    flexShrink: 1,
  },

  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },

  statusBadgeOpen: {
    backgroundColor: `${colors.secondary}18`,
    borderColor: `${colors.secondary}70`,
  },

  statusText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  content: {
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  contentAccent: {
    height: 3,
    width: '100%',
    backgroundColor: colors.primary,
  },

  contentInner: {
    padding: spacing.lg,
  },
});