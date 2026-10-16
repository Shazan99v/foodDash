import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';

import { colors } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';
import AuthGate from '../components/auth/AuthGate';

export default function RootLayout() {
  const initializeAuth = useAuthStore(
    (state) => state.initializeAuth
  );

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />

      <AuthGate />

      <Toast />
    </>
  );
}
