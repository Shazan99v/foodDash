import { create } from 'zustand';

import {
  type AuthUser,
  type LoginData,
  type CustomerRegisterData,
  type RiderRegisterData,
  type BusinessRegisterData,
  type UpdateProfileData,
  getCurrentUser,
  loginUser,
  registerBusiness,
  registerCustomer,
  registerRider,
  updateCurrentUser,
} from '../services/auth/authApi';

import {
  getAuthToken,
  removeAuthToken,
  saveAuthToken,
} from '../services/auth/authStorage';

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  initializeAuth: () => Promise<void>;

  login: (data: LoginData) => Promise<AuthUser>;

  registerCustomer: (
    data: CustomerRegisterData
  ) => Promise<AuthUser>;

  registerRider: (
    data: RiderRegisterData
  ) => Promise<AuthUser>;

  registerBusiness: (
    data: BusinessRegisterData
  ) => Promise<AuthUser>;

  updateProfile: (
    data: UpdateProfileData
  ) => Promise<AuthUser>;

  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,

  initializeAuth: async () => {
    set({ isLoading: true });

    try {
      const storedToken = await getAuthToken();

      if (!storedToken) {
        set({
          user: null,
          token: null,
          isLoading: false,
          isInitialized: true,
        });
        return;
      }

      try {
        const currentUser = await getCurrentUser(storedToken);

        set({
          user: currentUser,
          token: storedToken,
          isLoading: false,
          isInitialized: true,
        });
      } catch {
        await removeAuthToken();

        set({
          user: null,
          token: null,
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch {
      set({
        user: null,
        token: null,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  login: async (data) => {
    set({ isLoading: true });

    try {
      const response = await loginUser(data);

      await saveAuthToken(response.token);

      set({
        user: response.user,
        token: response.token,
        isLoading: false,
        isInitialized: true,
      });

      return response.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  registerCustomer: async (data) => {
    set({ isLoading: true });

    try {
      const response = await registerCustomer(data);

      await saveAuthToken(response.token);

      set({
        user: response.user,
        token: response.token,
        isLoading: false,
        isInitialized: true,
      });

      return response.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  registerRider: async (data) => {
    set({ isLoading: true });

    try {
      const response = await registerRider(data);

      await saveAuthToken(response.token);

      set({
        user: response.user,
        token: response.token,
        isLoading: false,
        isInitialized: true,
      });

      return response.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  registerBusiness: async (data) => {
    set({ isLoading: true });

    try {
      const response = await registerBusiness(data);

      await saveAuthToken(response.token);

      set({
        user: response.user,
        token: response.token,
        isLoading: false,
        isInitialized: true,
      });

      return response.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateProfile: async (data) => {
    const { token, user } = get();

    if (!token || !user) {
      throw new Error('Please log in to update your profile.');
    }

    set({ isLoading: true });

    try {
      const updatedUser = await updateCurrentUser(data);

      set({
        user: {
          ...user,
          ...updatedUser,
        },
        isLoading: false,
      });

      return updatedUser;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await removeAuthToken();

    set({
      user: null,
      token: null,
      isLoading: false,
    });
  },
}));