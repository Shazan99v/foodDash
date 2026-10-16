import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';

type CuisineId =
  | 'all'
  | 'burgers'
  | 'pizza'
  | 'asian'
  | 'healthy'
  | 'desserts';

type CuisineFiltersProps = {
  value?: CuisineId;
  onChange?: (cuisine: CuisineId) => void;
};

const cuisines: {
  id: CuisineId;
  title: string;
  icon:
    | 'grid-outline'
    | 'fast-food-outline'
    | 'pizza-outline'
    | 'restaurant-outline'
    | 'leaf-outline'
    | 'ice-cream-outline';
}[] = [
  { id: 'all', title: 'All', icon: 'grid-outline' },
  { id: 'burgers', title: 'Burgers', icon: 'fast-food-outline' },
  { id: 'pizza', title: 'Pizza', icon: 'pizza-outline' },
  { id: 'asian', title: 'Asian', icon: 'restaurant-outline' },
  { id: 'healthy', title: 'Healthy', icon: 'leaf-outline' },
  { id: 'desserts', title: 'Desserts', icon: 'ice-cream-outline' },
];

export default function CuisineFilters({
  value,
  onChange,
}: CuisineFiltersProps) {
  const [internalCuisine, setInternalCuisine] =
    useState<CuisineId>('all');

  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  const activeCuisine = value ?? internalCuisine;

  const handleCuisinePress = (cuisine: CuisineId) => {
    if (value === undefined) {
      setInternalCuisine(cuisine);
    }

    onChange?.(cuisine);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headingRow}>
          <View style={styles.headingAccent} />

          <View style={styles.headingContent}>
            <Text style={styles.eyebrow}>FIND YOUR FAVORITE</Text>

            <Text style={styles.title}>
              What are you craving?
            </Text>

            <Text style={styles.subtitle}>
              Pick a cuisine and discover something delicious.
            </Text>
          </View>

          <View style={styles.headingIcon}>
            <Ionicons
              name="restaurant-outline"
              size={21}
              color={colors.secondary}
            />
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          isCompact && styles.compactList,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {cuisines.map((cuisine) => {
          const isActive = cuisine.id === activeCuisine;

          return (
            <TouchableOpacity
              key={cuisine.id}
              accessibilityRole="button"
              accessibilityLabel={`${cuisine.title} cuisine`}
              accessibilityState={{ selected: isActive }}
              style={[
                styles.filter,
                isCompact && styles.compactFilter,
                isActive && styles.activeFilter,
              ]}
              activeOpacity={0.78}
              onPress={() => handleCuisinePress(cuisine.id)}
            >
              <View
                style={[
                  styles.iconContainer,
                  isActive && styles.activeIconContainer,
                ]}
              >
                <Ionicons
                  name={cuisine.icon}
                  size={17}
                  color={
                    isActive
                      ? colors.background
                      : colors.primary
                  }
                />
              </View>

              <Text
                style={[
                  styles.filterText,
                  isActive && styles.activeFilterText,
                ]}
              >
                {cuisine.title}
              </Text>

              {isActive && (
                <View style={styles.checkContainer}>
                  <Ionicons
                    name="checkmark"
                    size={13}
                    color={colors.background}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.xl,
  },

  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  headingAccent: {
    width: 4,
    alignSelf: 'stretch',
    minHeight: 58,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },

  headingContent: {
    flex: 1,
    minWidth: 0,
  },

  eyebrow: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: spacing.xs,
  },

  title: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.4,
  },

  subtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  headingIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },

  compactList: {
    paddingHorizontal: spacing.md,
  },

  filter: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 5,
    paddingRight: spacing.md,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  compactFilter: {
    minHeight: 44,
    paddingRight: spacing.sm,
  },

  activeFilter: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },

  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.sm,
  },

  activeIconContainer: {
    backgroundColor: colors.primary,
  },

  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  activeFilterText: {
    color: colors.background,
    fontWeight: '800',
  },

  checkContainer: {
    width: 19,
    height: 19,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
});