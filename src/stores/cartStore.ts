import { create } from 'zustand';

import { useAuthStore } from './authStore';

import {
  getCart,
  addCartItem as addServerCartItem,
  updateCartItem as updateServerCartItem,
  removeCartItem as removeServerCartItem,
  clearServerCart,
  type ServerCart,
} from '../services/customer/cartApi';

export type CartItem = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  userId: string | null;
  isLoading: boolean;
  error: string | null;
  loadCart: () => Promise<void>;
  addItem: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  increaseQuantity: (id: string) => Promise<void>;
  decreaseQuantity: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemCount: () => number;
  getSubtotal: () => number;
};

const getCurrentUserId = (): string | null =>
  useAuthStore.getState().user?.id ?? null;

const getEffectivePrice = (
  item: NonNullable<ServerCart['items'][number]['menuItem']>
): number => {
  const discountedPrice = item.discountedPrice;

  if (
    typeof discountedPrice === 'number' &&
    discountedPrice > 0 &&
    discountedPrice < item.price
  ) {
    return discountedPrice;
  }

  return item.price;
};

const mapServerCart = (
  cart: ServerCart,
  currentItems: CartItem[]
): CartItem[] => {
  return cart.items
    .filter(
      (item) =>
        item.menuItem &&
        typeof item.menuItem === 'object' &&
        item.menuItem._id
    )
    .map(({ menuItem, quantity }) => {
      const existingItem = currentItems.find(
        (item) => item.id === menuItem._id
      );

      return {
        id: menuItem._id,
        restaurantId:
          typeof menuItem.restaurant === 'string'
            ? menuItem.restaurant
            : '',
        restaurantName:
          existingItem?.restaurantName ?? 'Restaurant',
        name: menuItem.name,
        image: menuItem.image ?? '',
        price: getEffectivePrice(menuItem),
        quantity,
      };
    });
};

const applyServerCart = (
  cart: ServerCart,
  expectedUserId: string
) => {
  if (getCurrentUserId() !== expectedUserId) {
    return;
  }

  useCartStore.setState((state) => ({
    userId: expectedUserId,
    items: mapServerCart(cart, state.items),
    error: null,
  }));
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  userId: getCurrentUserId(),
  isLoading: false,
  error: null,

  loadCart: async () => {
    const customerId = getCurrentUserId();

    if (!customerId) {
      set({
        items: [],
        userId: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    set({
      items: [],
      userId: customerId,
      isLoading: true,
      error: null,
    });

    try {
      const response = await getCart();

      if (!response.success) {
        throw new Error(
          response.message ?? 'Unable to load your cart.'
        );
      }

      applyServerCart(response.cart, customerId);
    } catch (error) {
      if (getCurrentUserId() === customerId) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to load your cart.',
        });
      }
    } finally {
      if (getCurrentUserId() === customerId) {
        set({ isLoading: false });
      }
    }
  },

  addItem: async (item) => {
    const customerId = getCurrentUserId();

    if (!customerId) {
      set({ error: 'Please log in to use your cart.' });
      return;
    }

    if (get().userId !== customerId) {
      set({
        userId: customerId,
        items: [],
      });
    }

    try {
      const response = await addServerCartItem(item.id, 1);

      if (!response.success) {
        throw new Error(
          response.message ?? 'Unable to add this item.'
        );
      }

      if (getCurrentUserId() !== customerId) {
        return;
      }

      set((state) => ({
        userId: customerId,
        items: mapServerCart(
          response.cart,
          [
            ...state.items,
            {
              ...item,
              quantity: 1,
            },
          ]
        ),
        error: null,
      }));
    } catch (error) {
      if (getCurrentUserId() === customerId) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to add this item.',
        });
      }

      throw error;
    }
  },

  removeItem: async (id) => {
    const customerId = getCurrentUserId();

    if (!customerId) return;

    try {
      const response = await removeServerCartItem(id);

      if (!response.success) {
        throw new Error(
          response.message ?? 'Unable to remove this item.'
        );
      }

      if (getCurrentUserId() !== customerId) return;

      applyServerCart(response.cart, customerId);
    } catch (error) {
      if (getCurrentUserId() === customerId) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to remove this item.',
        });
      }

      throw error;
    }
  },

  increaseQuantity: async (id) => {
    const customerId = getCurrentUserId();

    if (!customerId) return;

    const item = get().items.find(
      (cartItem) => cartItem.id === id
    );

    if (!item) return;

    if (item.quantity >= 99) {
      set({ error: 'Maximum quantity per item is 99.' });
      return;
    }

    try {
      const response = await updateServerCartItem(
        id,
        item.quantity + 1
      );

      if (!response.success) {
        throw new Error(
          response.message ?? 'Unable to update quantity.'
        );
      }

      if (getCurrentUserId() !== customerId) return;

      applyServerCart(response.cart, customerId);
    } catch (error) {
      if (getCurrentUserId() === customerId) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to update quantity.',
        });
      }

      throw error;
    }
  },

  decreaseQuantity: async (id) => {
    const customerId = getCurrentUserId();

    if (!customerId) return;

    const item = get().items.find(
      (cartItem) => cartItem.id === id
    );

    if (!item) return;

    try {
      if (item.quantity <= 1) {
        await get().removeItem(id);
        return;
      }

      const response = await updateServerCartItem(
        id,
        item.quantity - 1
      );

      if (!response.success) {
        throw new Error(
          response.message ?? 'Unable to update quantity.'
        );
      }

      if (getCurrentUserId() !== customerId) return;

      applyServerCart(response.cart, customerId);
    } catch (error) {
      if (getCurrentUserId() === customerId) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to update quantity.',
        });
      }

      throw error;
    }
  },

  clearCart: async () => {
    const customerId = getCurrentUserId();

    if (!customerId) {
      set({ items: [], userId: null, error: null });
      return;
    }

    try {
      const response = await clearServerCart();

      if (!response.success) {
        throw new Error(
          response.message ?? 'Unable to clear your cart.'
        );
      }

      if (getCurrentUserId() !== customerId) return;

      applyServerCart(response.cart, customerId);
    } catch (error) {
      if (getCurrentUserId() === customerId) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to clear your cart.',
        });
      }

      throw error;
    }
  },

  getItemCount: () =>
    get().items.reduce(
      (total, item) => total + item.quantity,
      0
    ),

  getSubtotal: () =>
    get().items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    ),
}));

useAuthStore.subscribe((state, previousState) => {
  const currentUserId = state.user?.id ?? null;
  const previousUserId = previousState.user?.id ?? null;

  if (currentUserId === previousUserId) return;

  useCartStore.setState({
    userId: currentUserId,
    items: [],
    isLoading: false,
    error: null,
  });

  if (currentUserId) {
    void useCartStore.getState().loadCart();
  }
});