import api from '../api';

export type ServerCartItem = {
  menuItem: {
    _id: string;
    restaurant: string;
    category:
      | string
      | {
          _id: string;
          name: string;
          image?: string;
        };
    name: string;
    description?: string;
    image?: string;
    price: number;
    discountedPrice?: number;
    variations?: unknown[];
    addons?: unknown[];
    preparationTime?: number;
    isAvailable: boolean;
  };
  quantity: number;
};

export type ServerCart = {
  _id: string;
  customer: string;
  restaurant: string | null;
  items: ServerCartItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type CartApiResponse = {
  success: boolean;
  message?: string;
  code?: string;
  cart: ServerCart;
};

export const getCart = async (): Promise<CartApiResponse> => {
  const response = await api.get('/cart');

  return response.data;
};


export const addCartItem = async (
  menuItemId: string,
  quantity: number = 1
): Promise<CartApiResponse> => {
  try {
    const response = await api.post('/cart/items', {
      menuItemId,
      quantity,
    });

    return response.data;
  } catch (error: any) {
    console.error(
      'Add cart item failed:',
      error.response?.status,
      error.response?.data || error.message
    );

    throw error;
  }
};


export const updateCartItem = async (
  menuItemId: string,
  quantity: number
): Promise<CartApiResponse> => {
  const response = await api.patch(
    `/cart/items/${menuItemId}`,
    { quantity }
  );

  return response.data;
};

export const removeCartItem = async (
  menuItemId: string
): Promise<CartApiResponse> => {
  const response = await api.delete(
    `/cart/items/${menuItemId}`
  );

  return response.data;
};

export const clearServerCart =
  async (): Promise<CartApiResponse> => {
    const response = await api.delete('/cart');

    return response.data;
  };