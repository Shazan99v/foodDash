import api from '../api';
import { getAuthToken } from '../auth/authStorage';

export type BusinessRestaurant = {
  _id: string;
  owner: string;
  businessApplication?: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  images?: string[];
  cuisineCategories?: string[];
  address: string;
  city: string;
  area: string;
  location: string;
  phone: string;
  secondaryPhone?: string;
  openingTime: string;
  closingTime: string;
  deliveryAreas?: string[];
  averagePreparationTime: number;
  deliveryFee: number;
  deliveryRules?: string;
  commissionRate: number;
  payoutDetails?: string;
  rating: number;
  totalRatings: number;
  totalOrders: number;
  isOpen: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BusinessRestaurantResponse = {
  success: boolean;
  restaurant: BusinessRestaurant;
};

export type UpdateRestaurantStatusResponse = {
  success: boolean;
  message: string;
  restaurant: BusinessRestaurant;
};

export type UpdateRestaurantHoursResponse = {
  success: boolean;
  message: string;
  restaurant: BusinessRestaurant;
};

export type BusinessMenuCategory = {
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

export type BusinessCategoriesResponse = {
  success: boolean;
  count: number;
  categories: BusinessMenuCategory[];
};

export type UpdateCategoryStatusResponse = {
  success: boolean;
  message: string;
  category: BusinessMenuCategory;
};

export type BusinessMenuItemCategory = {
  _id: string;
  name: string;
  isActive: boolean;
};

export type BusinessMenuItemVariationOption = {
  name: string;
  price: number;
};

export type BusinessMenuItemVariation = {
  name: string;
  options: BusinessMenuItemVariationOption[];
};

export type BusinessMenuItemAddon = {
  name: string;
  price: number;
  isAvailable: boolean;
};

export type BusinessMenuItem = {
  _id: string;
  restaurant: string;
  category: string | BusinessMenuItemCategory;
  name: string;
  description?: string;
  image?: string;
  price: number;
  discountedPrice?: number;
  variations?: BusinessMenuItemVariation[];
  addons?: BusinessMenuItemAddon[];
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

export type BusinessMenuItemsResponse = {
  success: boolean;
  count: number;
  items: BusinessMenuItem[];
};

export type UpdateMenuItemStatusResponse = {
  success: boolean;
  message: string;
  item: BusinessMenuItem;
};

export type BusinessOrderStatus =
  | 'PLACED'
  | 'RECEIVED'
  | 'PREPARING'
  | 'READY'
  | 'ON_ROUTE'
  | 'DELIVERED'
  | 'CANCELLED';

export type BusinessOrderPerson = {
  _id?: string;
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
};

export type BusinessOrderRestaurant = {
  _id?: string;
  name?: string;
  address?: string;
  city?: string;
  area?: string;
};

export type BusinessOrderItem = {
  _id?: string;
  menuItem?: string;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  total: number;
};

export type BusinessOrder = {
  _id: string;
  orderNumber: string;
  customer: BusinessOrderPerson | string;
  restaurant: BusinessOrderRestaurant | string;
  business?: BusinessOrderPerson | string;
  rider?: BusinessOrderPerson | string | null;
  items: BusinessOrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: 'COD' | 'JAZZCASH' | 'EASYPAISA' | 'CARD' | string;
  paymentStatus?: string;
  status: BusinessOrderStatus;
  customerName: string;
  customerPhone: string;
  alternatePhone?: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryArea: string;
  customerNote?: string;
  riderAcceptedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessOrdersResponse = {
  success: boolean;
  count?: number;
  restaurant?: {
    _id: string;
    name: string;
    isActive?: boolean;
  };
  orders: BusinessOrder[];
};

export type BusinessOrderActionResponse = {
  success: boolean;
  message: string;
  order: BusinessOrder;
};

const getBusinessAuthHeaders = async () => {
  const token = await getAuthToken();

  if (!token) {
    throw new Error(
      'You must be logged in to access business management.',
    );
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getMyRestaurant =
  async (): Promise<BusinessRestaurant> => {
    const headers = await getBusinessAuthHeaders();

    const response =
      await api.get<BusinessRestaurantResponse>(
        '/business/restaurant',
        { headers },
      );

    return response.data.restaurant;
  };

export const updateRestaurantStatus = async (
  isOpen: boolean,
): Promise<BusinessRestaurant> => {
  const headers = await getBusinessAuthHeaders();

  const response =
    await api.patch<UpdateRestaurantStatusResponse>(
      '/business/restaurant/status',
      { isOpen },
      { headers },
    );

  return response.data.restaurant;
};

export const updateRestaurantHours = async (
  openingTime: string,
  closingTime: string,
): Promise<BusinessRestaurant> => {
  const headers = await getBusinessAuthHeaders();

  const response =
    await api.patch<UpdateRestaurantHoursResponse>(
      '/business/restaurant/hours',
      {
        openingTime,
        closingTime,
      },
      { headers },
    );

  return response.data.restaurant;
};

export const getMyCategories =
  async (): Promise<BusinessMenuCategory[]> => {
    const headers = await getBusinessAuthHeaders();

    const response =
      await api.get<BusinessCategoriesResponse>(
        '/business/categories',
        { headers },
      );

    return response.data.categories;
  };

export const updateMyCategoryStatus = async (
  categoryId: string,
  isActive: boolean,
): Promise<BusinessMenuCategory> => {
  const headers = await getBusinessAuthHeaders();

  const response =
    await api.patch<UpdateCategoryStatusResponse>(
      `/business/categories/${categoryId}/status`,
      { isActive },
      { headers },
    );

  return response.data.category;
};

export const getMyMenuItems =
  async (): Promise<BusinessMenuItem[]> => {
    const headers = await getBusinessAuthHeaders();

    const response =
      await api.get<BusinessMenuItemsResponse>(
        '/business/menu-items',
        { headers },
      );

    return response.data.items;
  };

export const updateMyMenuItemStatus = async (
  itemId: string,
  isAvailable: boolean,
): Promise<BusinessMenuItem> => {
  const headers = await getBusinessAuthHeaders();

  const response =
    await api.patch<UpdateMenuItemStatusResponse>(
      `/business/menu-items/${itemId}/status`,
      { isAvailable },
      { headers },
    );

  return response.data.item;
};

/**
 * Get every order belonging to the logged-in restaurant.
 */
export const getMyRestaurantOrders =
  async (): Promise<BusinessOrdersResponse> => {
    const headers = await getBusinessAuthHeaders();

    const response =
      await api.get<BusinessOrdersResponse>(
        '/business/orders',
        { headers },
      );

    return response.data;
  };

/**
 * Accept a newly placed customer order.
 */
export const acceptRestaurantOrder = async (
  orderId: string,
): Promise<BusinessOrder> => {
  const headers = await getBusinessAuthHeaders();

  const response =
    await api.patch<BusinessOrderActionResponse>(
      `/business/orders/${orderId}/accept`,
      {},
      { headers },
    );

  return response.data.order;
};

/**
 * Reject a newly placed order. An optional reason is recorded.
 */
export const rejectRestaurantOrder = async (
  orderId: string,
  reason?: string,
): Promise<BusinessOrder> => {
  const headers = await getBusinessAuthHeaders();

  const response =
    await api.patch<BusinessOrderActionResponse>(
      `/business/orders/${orderId}/reject`,
      { reason: reason || 'Rejected by restaurant.' },
      { headers },
    );

  return response.data.order;
};

/**
 * Move an accepted order to food preparation.
 */
export const startPreparingRestaurantOrder = async (
  orderId: string,
): Promise<BusinessOrder> => {
  const headers = await getBusinessAuthHeaders();

  const response =
    await api.patch<BusinessOrderActionResponse>(
      `/business/orders/${orderId}/prepare`,
      {},
      { headers },
    );

  return response.data.order;
};

/**
 * Mark a prepared order as ready for rider pickup.
 */
export const markRestaurantOrderReady = async (
  orderId: string,
): Promise<BusinessOrder> => {
  const headers = await getBusinessAuthHeaders();

  const response =
    await api.patch<BusinessOrderActionResponse>(
      `/business/orders/${orderId}/ready`,
      {},
      { headers },
    );

  return response.data.order;
};
