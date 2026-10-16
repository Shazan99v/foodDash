import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useSegments } from 'expo-router';

import { useAuthStore } from '../../stores/authStore';

const colors = {
  primary: '#FF6B1A',
  primaryDark: '#E8520C',
  secondary: '#C6F54A',
  background: '#111315',
  surface: '#1B1E21',
  border: '#343A3F',
  text: '#F5F5F0',
  textSecondary: '#B8BEC3',
};

export default function AuthGate() {
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore(
    (state) => state.isInitialized,
  );
  const isLoading = useAuthStore((state) => state.isLoading);

  const segments = useSegments();

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const currentRoute = segments.join('/');

    const isAuthRoute =
      currentRoute === 'login' ||
      currentRoute === 'register' ||
      currentRoute.startsWith('register/');

    const isStatusRoute =
      currentRoute === 'rider-pending' ||
      currentRoute === 'rider-rejected' ||
      currentRoute === 'business-pending' ||
      currentRoute === 'business-rejected';

    // Guests can browse; protected actions handle authentication.
    if (!user) {
      return;
    }

    if (user.role === 'CUSTOMER') {
      if (isAuthRoute || isStatusRoute) {
        router.replace('/');
      }

      return;
    }

    if (user.role === 'RIDER') {
      if (user.status === 'PENDING') {
        if (currentRoute !== 'rider-pending') {
          router.replace('/rider-pending');
        }

        return;
      }

      if (user.status === 'REJECTED') {
        if (currentRoute !== 'rider-rejected') {
          router.replace('/rider-rejected');
        }

        return;
      }

      if (
        user.status === 'ACTIVE' &&
        (isAuthRoute || isStatusRoute)
      ) {
        router.replace('/rider');
      }

      return;
    }

    if (user.role === 'BUSINESS') {
      if (user.status === 'PENDING') {
        if (currentRoute !== 'business-pending') {
          router.replace('/business-pending');
        }

        return;
      }

      if (user.status === 'REJECTED') {
        if (currentRoute !== 'business-rejected') {
          router.replace('/business-rejected');
        }

        return;
      }

      if (
        user.status === 'ACTIVE' &&
        (isAuthRoute || isStatusRoute)
      ) {
        router.replace('/business');
      }

      return;
    }

    if (user.role === 'ADMIN') {
      if (isAuthRoute || isStatusRoute) {
        router.replace('/admin');
      }
    }
  }, [user, isInitialized, segments]);

  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loading}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons
              name="restaurant"
              size={32}
              color={colors.background}
            />
          </View>

          <View style={styles.logoAccent} />
        </View>

        <View style={styles.loadingIndicator}>
          <ActivityIndicator
            size="small"
            color={colors.secondary}
          />

          <Text style={styles.loadingText}>
            Checking your account...
          </Text>
        </View>

        <Text style={styles.loadingTitle}>
          FoodDash
        </Text>

        <Text style={styles.loadingSubtitle}>
          GOOD FOOD. GOOD MOOD.
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 1000,
  },

  logoContainer: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: '#FF9A5C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },

  logoAccent: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    borderWidth: 3,
    borderColor: colors.background,
  },

  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  loadingTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginBottom: 8,
  },

  loadingSubtitle: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});