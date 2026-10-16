import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { colors, radius, spacing } from '@/constants/theme';

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

export function HintRow({
  title = 'Try editing',
  hint = 'app/index.tsx',
}: HintRowProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  return (
    <View style={[styles.stepRow, isCompact && styles.compactStepRow]}>
      <View style={styles.titleRow}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="bulb-outline"
            size={16}
            color={colors.secondary}
          />
        </View>

        <ThemedText type="small" style={styles.title}>
          {title}
        </ThemedText>
      </View>

      <ThemedView
        type="backgroundSelected"
        style={[styles.codeSnippet, isCompact && styles.compactCodeSnippet]}
      >
        <Ionicons
          name="code-slash-outline"
          size={14}
          color={colors.primary}
        />
        <View style={styles.hintContent}>
          <ThemedText themeColor="textSecondary" style={styles.hint}>
            {hint}
          </ThemedText>
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },

  compactStepRow: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: spacing.sm,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },

  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: '#C6F54A18',
    borderWidth: 1,
    borderColor: '#C6F54A40',
  },

  title: {
    color: colors.text,
    fontWeight: '600',
    flexShrink: 1,
  },

  codeSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: '65%',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  compactCodeSnippet: {
    maxWidth: '100%',
    alignSelf: 'stretch',
  },

  hintContent: {
    flexShrink: 1,
  },

  hint: {
    fontSize: 12,
    flexShrink: 1,
  },
});