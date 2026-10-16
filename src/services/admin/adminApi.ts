import api from '../api';
import { getAuthToken } from '../auth/authStorage';

// -----------------------------------------------------------------------------
// Application types
// -----------------------------------------------------------------------------

export type RiderApplication = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
};

export type BusinessApplication = {
  _id: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
};

// -----------------------------------------------------------------------------
// Business owner
// -----------------------------------------------------------------------------

export type AdminBusinessOwner = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  status: string;
};

export type AdminBusinessOwnersResponse = {
  success: boolean;
  count: number;
  owners: AdminBusinessOwner[];
};

// -----------------------------------------------------------------------------
// Restaurant types
// -----------------------------------------------------------------------------

export type RestaurantOwner = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  profilePhoto?: string;
};

export type RestaurantBusinessApplication = {
  _id: string;
  restaurantName?: string;
  ownerName?: string;
  status?: string;
};

export type AdminRestaurant = {
  _id: string;

  owner:
    | string
    | RestaurantOwner;

  businessApplication?:
    | string
    | RestaurantBusinessApplication;

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

  averagePreparationTime?: number;
  deliveryFee?: number;
  deliveryRules?: string;

  commissionRate?: number;
  payoutDetails?: string;

  rating?: number;
  totalRatings?: number;
  totalOrders?: number;

  isOpen: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;

  createdAt?: string;
  updatedAt?: string;
};

export type AdminRestaurantsResponse = {
  success: boolean;
  count: number;
  restaurants: AdminRestaurant[];
};

export type AdminRestaurantResponse = {
  success: boolean;
  restaurant: AdminRestaurant;
};

// -----------------------------------------------------------------------------
// Create restaurant
// -----------------------------------------------------------------------------

export type CreateRestaurantData = {
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

  averagePreparationTime?: number;
  deliveryFee?: number;
  deliveryRules?: string;

  commissionRate?: number;
  payoutDetails?: string;

  isOpen?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
};

// -----------------------------------------------------------------------------
// Update restaurant
// -----------------------------------------------------------------------------

export type UpdateRestaurantData = Partial<
  CreateRestaurantData
>;

// -----------------------------------------------------------------------------
// Restaurant status
// -----------------------------------------------------------------------------

export type UpdateRestaurantStatusData = {
  isOpen?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
};

// -----------------------------------------------------------------------------
// Authentication helper
// -----------------------------------------------------------------------------

const getAuthHeaders = async () => {
  const token = await getAuthToken();

  return {
    Authorization: `Bearer ${token}`,
  };
};

// -----------------------------------------------------------------------------
// Rider applications
// -----------------------------------------------------------------------------

export const getPendingRiderApplications = async () => {
  const headers = await getAuthHeaders();

  const response = await api.get(
    '/admin/applications/riders',
    {
      headers,
    }
  );

  return response.data;
};

export const approveRiderApplication = async (
  applicationId: string
) => {
  const headers = await getAuthHeaders();

  const response = await api.patch(
    `/admin/applications/riders/${applicationId}/approve`,
    {},
    {
      headers,
    }
  );

  return response.data;
};

export const rejectRiderApplication = async (
  applicationId: string,
  reason: string
) => {
  const headers = await getAuthHeaders();

  const response = await api.patch(
    `/admin/applications/riders/${applicationId}/reject`,
    {
      reason,
    },
    {
      headers,
    }
  );

  return response.data;
};

// -----------------------------------------------------------------------------
// Business applications
// -----------------------------------------------------------------------------

export const getPendingBusinessApplications = async () => {
  const headers = await getAuthHeaders();

  const response = await api.get(
    '/admin/applications/businesses',
    {
      headers,
    }
  );

  return response.data;
};

export const approveBusinessApplication = async (
  applicationId: string
) => {
  const headers = await getAuthHeaders();

  const response = await api.patch(
    `/admin/applications/businesses/${applicationId}/approve`,
    {},
    {
      headers,
    }
  );

  return response.data;
};

export const rejectBusinessApplication = async (
  applicationId: string,
  reason: string
) => {
  const headers = await getAuthHeaders();

  const response = await api.patch(
    `/admin/applications/businesses/${applicationId}/reject`,
    {
      reason,
    },
    {
      headers,
    }
  );

  return response.data;
};

// -----------------------------------------------------------------------------
// Business owners
// -----------------------------------------------------------------------------

export const getBusinessOwners =
  async (): Promise<AdminBusinessOwnersResponse> => {
    const headers = await getAuthHeaders();

    const response = await api.get(
      '/admin/business-owners',
      {
        headers,
      }
    );

    return response.data;
  };

// -----------------------------------------------------------------------------
// Restaurants
// -----------------------------------------------------------------------------

export const getAllRestaurants =
  async (): Promise<AdminRestaurantsResponse> => {
    const headers = await getAuthHeaders();

    const response = await api.get(
      '/admin/restaurants',
      {
        headers,
      }
    );

    return response.data;
  };

export const getRestaurantById =
  async (
    restaurantId: string
  ): Promise<AdminRestaurantResponse> => {
    const headers = await getAuthHeaders();

    const response = await api.get(
      `/admin/restaurants/${restaurantId}`,
      {
        headers,
      }
    );

    return response.data;
  };

export const createRestaurant =
  async (
    data: CreateRestaurantData
  ): Promise<AdminRestaurantResponse> => {
    const headers = await getAuthHeaders();

    const response = await api.post(
      '/admin/restaurants',
      data,
      {
        headers,
      }
    );

    return response.data;
  };

export const updateRestaurant =
  async (
    restaurantId: string,
    data: UpdateRestaurantData
  ): Promise<AdminRestaurantResponse> => {
    const headers = await getAuthHeaders();

    const response = await api.patch(
      `/admin/restaurants/${restaurantId}`,
      data,
      {
        headers,
      }
    );

    return response.data;
  };

export const deleteRestaurant =
  async (
    restaurantId: string
  ) => {
    const headers = await getAuthHeaders();

    const response = await api.delete(
      `/admin/restaurants/${restaurantId}`,
      {
        headers,
      }
    );

    return response.data;
  };

export const updateRestaurantStatus =
  async (
    restaurantId: string,
    data: UpdateRestaurantStatusData
  ) => {
    const headers = await getAuthHeaders();

    const response = await api.patch(
      `/admin/restaurants/${restaurantId}/status`,
      data,
      {
        headers,
      }
    );

    return response.data;
  };