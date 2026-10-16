import api from '../api';

export type CustomerRestaurant = {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  images?: string[];
  cuisineCategories?: string[];
  address?: string;
  city?: string;
  area?: string;
  phone?: string;
  secondaryPhone?: string;
  openingTime?: string;
  closingTime?: string;
  deliveryAreas?: string[];
  averagePreparationTime?: number;
  deliveryFee?: number;
  rating?: number;
  totalRatings?: number;
  totalOrders?: number;
  isOpen: boolean;
  isFeatured: boolean;
  isVerified: boolean;
};

export type CustomerMenuCategory = {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  sortOrder?: number;
  isActive: boolean;
};

export type CustomerMenuItem = {
  _id: string;
  restaurant: string;
  category:
    | string
    | {
        _id: string;
        name: string;
        image?: string;
        sortOrder?: number;
        isActive?: boolean;
      };
  name: string;
  description?: string;
  image?: string;
  price: number;
  discountedPrice?: number;
  variations?: unknown[];
  addons?: unknown[];
  preparationTime?: number;
  sortOrder?: number;
  isAvailable: boolean;
  isFeatured: boolean;
  rating?: number;
  totalRatings?: number;
};

export const getCustomerRestaurants = async () => {
  const response = await api.get(
    '/catalog/restaurants'
  );

  return response.data;
};

export const getCustomerRestaurant = async (
  restaurantId: string
) => {
  const response = await api.get(
    `/catalog/restaurants/${restaurantId}`
  );

  return response.data;
};

export const getCustomerRestaurantMenu = async (
  restaurantId: string
) => {
  const response = await api.get(
    `/catalog/restaurants/${restaurantId}/menu`
  );

  return response.data;
};