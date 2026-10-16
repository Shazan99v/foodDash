import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';
import RestaurantCard from './RestaurantCard';
import { CustomerRestaurant } from '../../services/customer/catalogApi';

type CuisineId =
  | 'all'
  | 'burgers'
  | 'pizza'
  | 'asian'
  | 'healthy'
  | 'desserts';

type RestaurantFeedProps = {
  restaurants: CustomerRestaurant[];
  searchQuery?: string;
  cuisine?: CuisineId;
};

export default function RestaurantFeed({
  restaurants,
  searchQuery = '',
  cuisine = 'all',
}: RestaurantFeedProps) {
  const hasFilters =
    searchQuery.trim().length > 0 ||
    cuisine !== 'all';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headingRow}>
          <View style={styles.headingAccent} />

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              {hasFilters ? 'YOUR SEARCH RESULTS' : 'DISCOVER GREAT FOOD'}
            </Text>

            <Text style={styles.title}>
              {hasFilters
                ? 'Matching Restaurants'
                : 'Restaurants Near You'}
            </Text>

            <Text style={styles.subtitle}>
              {hasFilters
                ? 'Restaurants matching your preferences'
                : 'Delicious food, delivered to your door'}
            </Text>
          </View>
        </View>

        <View style={styles.countBadge}>
          <Ionicons
            name="restaurant-outline"
            size={14}
            color={colors.background}
          />

          <Text style={styles.count}>
            {restaurants.length}
          </Text>
        </View>
      </View>

      {restaurants.length > 0 ? (
        <View style={styles.list}>
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant._id}
              restaurant={restaurant}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyDecoration} />

          <View style={styles.emptyIcon}>
            <Ionicons
              name="search-outline"
              size={29}
              color={colors.secondary}
            />
          </View>

          <Text style={styles.emptyEyebrow}>
            NOTHING ON THE MENU
          </Text>

          <Text style={styles.emptyTitle}>
            No restaurants found
          </Text>

          <Text style={styles.emptyText}>
            Try another search or choose a different cuisine.
            Your next favorite meal might be just around the corner.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },

  headingRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },

  headingAccent: {
    width: 4,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.secondary,
    letterSpacing: 1.5,
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
    color: colors.textSecondary,
    marginTop: 5,
    lineHeight: 16,
  },

  countBadge: {
    minWidth: 43,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: radius.round,
  },

  count: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.background,
  },

  list: {
    width: '100%',
  },

  emptyState: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },

  emptyDecoration: {
    position: 'absolute',
    top: -55,
    right: -40,
    width: 145,
    height: 145,
    borderRadius: 100,
    backgroundColor: '#FF6B1A0D',
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  emptyEyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
});