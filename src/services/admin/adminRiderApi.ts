import api from '../api';

export interface RiderUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  secondaryPhone?: string;
  address?: string;
  city?: string;
  area?: string;
  profilePhoto?: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface RiderProfile {
  _id: string;
  user: string;
  vehicleType: 'BIKE' | 'CYCLE';
  vehicleNumber: string;
  vehiclePhoto?: string;
  drivingLicenseNumber?: string;
  city: string;
  area: string;
  currentLocation?: {
    type?: string;
    coordinates?: number[];
  };
  isAvailable: boolean;
  isOnline: boolean;
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  rating: number;
  totalRatings: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiderApplication {
  _id: string;
  user: string;
  name: string;
  fatherName: string;
  mobileNumber: string;
  fatherMobileNumber: string;
  email: string;
  cnic: string;
  vehicleType: 'BIKE' | 'CYCLE';
  vehicleNumber: string;
  vehiclePhoto: string;
  drivingLicenseNumber: string;
  city: string;
  area: string;
  completeAddress: string;
  emergencyContact: string;
  dailyWorkingHours: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRider {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  secondaryPhone?: string;
  address?: string;
  city?: string;
  area?: string;
  profilePhoto?: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  profile: RiderProfile | null;
  application: RiderApplication | null;
}

export interface UpdateRiderData {
  name: string;
  phone: string;
  secondaryPhone: string;
  address: string;
  city: string;
  area: string;
  vehicleType: 'BIKE' | 'CYCLE';
  vehicleNumber: string;
  drivingLicenseNumber: string;
}

export interface RiderFeedback {
  _id: string;
  rider: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    status?: string;
  };
  customer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    profilePhoto?: string;
  };
  order: {
    _id: string;
    createdAt: string;
    status: string;
    totalAmount?: number;
  };
  rating: number;
  feedback?: string;
  behaviorTags?: string[];
  adminNote?: string;
  reviewedByAdmin: boolean;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiderFeedbackSummary {
  totalReviews: number;
  averageRating: number;
  positiveReviews: number;
  negativeReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface GetRidersResponse {
  success: boolean;
  count: number;
  riders: AdminRider[];
}

interface UpdateRiderResponse {
  success: boolean;
  message: string;
  rider: AdminRider;
}

interface RiderActionResponse {
  success: boolean;
  message: string;
}

interface RiderFeedbackResponse {
  success: boolean;
  summary: RiderFeedbackSummary;
  feedback: RiderFeedback[];
}

export const getAllRiders = async (): Promise<AdminRider[]> => {
  const response = await api.get<GetRidersResponse>(
    '/admin/riders'
  );

  return response.data.riders || [];
};

export const updateRider = async (
  riderId: string,
  data: UpdateRiderData
): Promise<AdminRider> => {
  const response = await api.patch<UpdateRiderResponse>(
    `/admin/riders/${riderId}`,
    data
  );

  return response.data.rider;
};

export const banRider = async (
  riderId: string
): Promise<string> => {
  const response = await api.patch<RiderActionResponse>(
    `/admin/riders/${riderId}/ban`
  );

  return response.data.message;
};

export const unbanRider = async (
  riderId: string
): Promise<string> => {
  const response = await api.patch<RiderActionResponse>(
    `/admin/riders/${riderId}/unban`
  );

  return response.data.message;
};

export const getRiderFeedback = async (
  riderId: string
): Promise<{
  summary: RiderFeedbackSummary;
  feedback: RiderFeedback[];
}> => {
  const response =
    await api.get<RiderFeedbackResponse>(
      `/admin/riders/${riderId}/feedback`
    );

  return {
    summary: response.data.summary,
    feedback: response.data.feedback || [],
  };
};