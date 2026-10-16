import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'food_app_auth_token';

export const saveAuthToken = async (
  token: string
): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(
    TOKEN_KEY,
    token
  );
};

export const getAuthToken = async (): Promise<
  string | null
> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }

  return SecureStore.getItemAsync(
    TOKEN_KEY
  );
};

export const removeAuthToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(
    TOKEN_KEY
  );
};