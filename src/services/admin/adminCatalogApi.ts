import api from '../api';
import { getAuthToken } from '../auth/authStorage';

export type AdminRestaurant = {
  _id: string;
  name: string;
  city: string;
  area: string;
  address: string;
  location: string;
  phone: string;
  isOpen: boolean;
  isActive: boolean;
};

export type AdminCategory = {
  _id: string;
  restaurant: string;
  name: string;
  description?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminVariationOption = {
  name: string;
  price: number;
};

export type AdminVariation = {
  name: string;
  options: AdminVariationOption[];
};

export type AdminAddon = {
  name: string;
  price: number;
  isAvailable: boolean;
};

export type AdminMenuItemCategory = {
  _id: string;
  name: string;
  image?: string;
  isActive: boolean;
};

export type AdminMenuItem = {
  _id: string;
  restaurant: string;
  category: AdminMenuItemCategory | string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  discountedPrice?: number;
  variations?: AdminVariation[];
  addons?: AdminAddon[];
  preparationTime: number;
  sortOrder: number;
  isAvailable: boolean;
  isFeatured: boolean;
  totalOrders: number;
  rating: number;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
};

type RestaurantsResponse = {
  success: boolean;
  restaurants: AdminRestaurant[];
};

type CategoriesResponse = {
  success: boolean;
  count: number;
  categories: AdminCategory[];
};

type CategoryResponse = {
  success: boolean;
  message: string;
  category: AdminCategory;
};

type MenuItemsResponse = {
  success: boolean;
  count: number;
  items: AdminMenuItem[];
};

type MenuItemResponse = {
  success: boolean;
  message: string;
  item: AdminMenuItem;
};

const getHeaders = async () => {
  const token = await getAuthToken();

  if (!token) {
    throw new Error(
      'You must be logged in as an admin.'
    );
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getAdminRestaurants =
  async (): Promise<AdminRestaurant[]> => {
    const headers = await getHeaders();

    const response =
      await api.get<RestaurantsResponse>(
        '/admin/restaurants',
        {
          headers,
        }
      );

    return response.data.restaurants;
  };

export const getRestaurantCategories =
  async (
    restaurantId: string
  ): Promise<AdminCategory[]> => {
    const headers = await getHeaders();

    const response =
      await api.get<CategoriesResponse>(
        `/admin/catalog/restaurants/${restaurantId}/categories`,
        {
          headers,
        }
      );

    return response.data.categories;
  };

export const createCategory = async (
  restaurantId: string,
  data: {
    name: string;
    description?: string;
    image?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
): Promise<AdminCategory> => {
  const headers = await getHeaders();

  const response =
    await api.post<CategoryResponse>(
      `/admin/catalog/restaurants/${restaurantId}/categories`,
      data,
      {
        headers,
      }
    );

  return response.data.category;
};

export const updateCategory = async (
  categoryId: string,
  data: {
    name?: string;
    description?: string;
    image?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
): Promise<AdminCategory> => {
  const headers = await getHeaders();

  const response =
    await api.patch<CategoryResponse>(
      `/admin/catalog/categories/${categoryId}`,
      data,
      {
        headers,
      }
    );

  return response.data.category;
};

export const deleteCategory = async (
  categoryId: string
): Promise<void> => {
  const headers = await getHeaders();

  await api.delete(
    `/admin/catalog/categories/${categoryId}`,
    {
      headers,
    }
  );
};

export const getRestaurantMenuItems =
  async (
    restaurantId: string
  ): Promise<AdminMenuItem[]> => {
    const headers = await getHeaders();

    const response =
      await api.get<MenuItemsResponse>(
        `/admin/catalog/restaurants/${restaurantId}/items`,
        {
          headers,
        }
      );

    return response.data.items;
  };

export const createMenuItem = async (
  restaurantId: string,
  data: {
    category: string;
    name: string;
    description?: string;
    image?: string;
    price: number;
    discountedPrice?: number;
    variations?: AdminVariation[];
    addons?: AdminAddon[];
    preparationTime?: number;
    sortOrder?: number;
    isAvailable?: boolean;
    isFeatured?: boolean;
  }
): Promise<AdminMenuItem> => {
  const headers = await getHeaders();

  const response =
    await api.post<MenuItemResponse>(
      `/admin/catalog/restaurants/${restaurantId}/items`,
      data,
      {
        headers,
      }
    );

  return response.data.item;
};

export const updateMenuItem = async (
  itemId: string,
  data: {
    category?: string;
    name?: string;
    description?: string;
    image?: string;
    price?: number;
    discountedPrice?: number;
    variations?: AdminVariation[];
    addons?: AdminAddon[];
    preparationTime?: number;
    sortOrder?: number;
    isAvailable?: boolean;
    isFeatured?: boolean;
  }
): Promise<AdminMenuItem> => {
  const headers = await getHeaders();

  const response =
    await api.patch<MenuItemResponse>(
      `/admin/catalog/items/${itemId}`,
      data,
      {
        headers,
      }
    );

  return response.data.item;
};

export const deleteMenuItem = async (
  itemId: string
): Promise<void> => {
  const headers = await getHeaders();

  await api.delete(
    `/admin/catalog/items/${itemId}`,
    {
      headers,
    }
  );
};