import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  colors,
  spacing,
  radius,
} from '../constants/theme';

import HomeHeader from '../components/home/HomeHeader';
import HeroBanner from '../components/home/HeroBanner';
import SearchBar from '../components/home/SearchBar';
import ServiceCategories from '../components/home/ServiceCategories';
import CuisineFilters from '../components/home/CuisineFilters';
import RestaurantFeed from '../components/home/RestaurantFeed';
import RewardsBanner from '../components/home/RewardsBanner';
import BottomNavigation from '../components/navigation/BottomNavigation';

import {
  CustomerRestaurant,
  getCustomerRestaurants,
} from '../services/customer/catalogApi';

type CuisineId =
  | 'all'
  | 'burgers'
  | 'pizza'
  | 'asian'
  | 'healthy'
  | 'desserts';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] =
    useState('');

  const [selectedCuisine, setSelectedCuisine] =
    useState<CuisineId>('all');

  const [restaurants, setRestaurants] =
    useState<CustomerRestaurant[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    let isMounted = true;

    const loadRestaurants = async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await getCustomerRestaurants();

        if (!isMounted) return;

        setRestaurants(
          Array.isArray(response?.restaurants)
            ? response.restaurants
            : []
        );
      } catch (requestError) {
        console.error(
          'Load customer restaurants error:',
          requestError
        );

        if (isMounted) {
          setError(
            'Unable to load restaurants right now.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRestaurants();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRestaurants = useMemo(() => {
    const normalizedSearch =
      searchQuery.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const cuisineText = (
        restaurant.cuisineCategories || []
      )
        .join(' ')
        .toLowerCase();

      const searchableText = [
        restaurant.name,
        restaurant.description || '',
        cuisineText,
        restaurant.area || '',
        restaurant.city || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      const matchesCuisine =
        selectedCuisine === 'all' ||
        cuisineText.includes(
          selectedCuisine.toLowerCase()
        );

      return matchesSearch && matchesCuisine;
    });
  }, [
    restaurants,
    searchQuery,
    selectedCuisine,
  ]);

  const handleFilterPress = () => {
    setSelectedCuisine('all');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <HomeHeader />

        <HeroBanner />

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={handleFilterPress}
        />

        <ServiceCategories />

        <CuisineFilters
          value={selectedCuisine}
          onChange={setSelectedCuisine}
        />

        {loading ? (
          <View style={styles.loadingState}>
            <View style={styles.loadingIcon}>
              <ActivityIndicator
                size="large"
                color={colors.secondary}
              />
            </View>

            <Text style={styles.loadingTitle}>
              Finding your next favourite
            </Text>

            <Text style={styles.loadingText}>
              Loading restaurants...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorEmoji}>
                !
              </Text>
            </View>

            <Text style={styles.errorTitle}>
              Restaurants unavailable
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : (
          <RestaurantFeed
            restaurants={filteredRestaurants as any}
            searchQuery={searchQuery}
            cuisine={selectedCuisine}
          />
        )}

        <RewardsBanner />
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingBottom: 110,
  },

  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 48,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },

  loadingIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.lg,
  },

  loadingTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },

  errorState: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },

  errorIcon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: '#3A2224',
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: spacing.lg,
  },

  errorEmoji: {
    color: colors.danger,
    fontSize: 28,
    fontWeight: '900',
  },

  errorTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },

  errorText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
