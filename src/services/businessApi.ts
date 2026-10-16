import api from './api';
import { getAuthToken } from './auth/authStorage';

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

  location: {
    type: 'Point';
    coordinates: [number, number];
  };

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

export const getMyRestaurant =
  async (): Promise<BusinessRestaurant> => {
    const token = await getAuthToken();

    if (!token) {
      throw new Error(
        'You must be logged in to access your restaurant.'
      );
    }

    const response =
      await api.get<BusinessRestaurantResponse>(
        '/business/restaurant',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    return response.data.restaurant;
  };