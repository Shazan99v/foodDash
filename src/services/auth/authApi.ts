import api from '../api';
import { Platform } from 'react-native';
import type * as ImagePicker from 'expo-image-picker';

export type UserRole =
  | 'CUSTOMER'
  | 'RIDER'
  | 'BUSINESS'
  | 'ADMIN';

export type UserStatus =
  | 'ACTIVE'
  | 'PENDING'
  | 'REJECTED'
  | 'SUSPENDED';

export type UserLocation = {
  type: 'Point';
  coordinates: [number, number];
};

export type PhoneNumberLabel =
  | 'PERSONAL'
  | 'WORK'
  | 'OTHER';

export type SavedPhoneNumber = {
  _id: string;
  label: PhoneNumberLabel | string;
  number: string;
  isPrimary: boolean;
};

export type SavedAddress = {
  _id: string;
  label: string;
  recipientName: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  area: string;
  landmark?: string;
  location?: UserLocation;
  isDefault: boolean;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  secondaryPhone?: string;
  phoneNumbers?: SavedPhoneNumber[];
  savedAddresses?: SavedAddress[];
  address?: string;
  city?: string;
  area?: string;
  location?: UserLocation;
  profilePhoto?: string;
  rejectionReason?: string;
};

export type AuthResponse = {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
};

export type LoginData = {
  email: string;
  password: string;
};

export type CustomerRegisterData = {
  name: string;
  email: string;
  password: string;
};

export type RiderRegisterData = {
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
  password: string;
};

export type BusinessRegisterData = {
  ownerName: string;
  ownerMobileNumber: string;
  email: string;
  completeAddress: string;
  city: string;
  area: string;
  restaurantLocation: UserLocation;
  logo?: string;
  banner?: string;
  images?: string[];
  loginEmail: string;
  password: string;
};

export type UpdateProfileData = {
  name?: string;
  phone?: string;
  secondaryPhone?: string;
  address?: string;
  city?: string;
  area?: string;
  profilePhoto?: string;
  location?: UserLocation | null;
};

export type AddPhoneNumberData = {
  label: PhoneNumberLabel | string;
  number: string;
  isPrimary?: boolean;
};

export type UpdatePhoneNumberData = {
  label?: PhoneNumberLabel | string;
  number?: string;
  isPrimary?: boolean;
};

export type AddSavedAddressData = {
  label: string;
  recipientName: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  area: string;
  landmark?: string;
  location?: UserLocation | null;
  isDefault?: boolean;
};

export type UpdateSavedAddressData = Partial<AddSavedAddressData>;

export type VehiclePhotoUploadResponse = {
  success: boolean;
  message: string;
  photoUrl: string;
};

type UserResponse = {
  success: boolean;
  message?: string;
  user: AuthUser;
};

type PhoneNumbersResponse = {
  success: boolean;
  message?: string;
  phoneNumbers: SavedPhoneNumber[];
};

type SavedAddressesResponse = {
  success: boolean;
  message?: string;
  addresses: SavedAddress[];
};

export const loginUser = async (
  data: LoginData
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    '/auth/login',
    data
  );

  return response.data;
};

export const registerCustomer = async (
  data: CustomerRegisterData
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    '/auth/customer/register',
    data
  );

  return response.data;
};

export const uploadVehiclePhoto = async (
  asset: ImagePicker.ImagePickerAsset
): Promise<string> => {
  const formData = new FormData();

  const fileName =
    asset.fileName || `vehicle-${Date.now()}.jpg`;

  const mimeType = asset.mimeType || 'image/jpeg';

  if (Platform.OS === 'web') {
    const webAsset =
      asset as ImagePicker.ImagePickerAsset & {
        file?: Blob;
      };

    if (webAsset.file) {
      formData.append(
        'vehiclePhoto',
        webAsset.file,
        fileName
      );
    } else {
      const response = await fetch(asset.uri);

      if (!response.ok) {
        throw new Error(
          'Unable to read the selected vehicle photo.'
        );
      }

      const blob = await response.blob();

      formData.append('vehiclePhoto', blob, fileName);
    }
  } else {
    formData.append(
      'vehiclePhoto',
      {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      } as any
    );
  }

  const response =
    await api.post<VehiclePhotoUploadResponse>(
      '/uploads/vehicle',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

  return response.data.photoUrl;
};

export const registerRider = async (
  data: RiderRegisterData
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    '/applications/rider',
    data
  );

  return response.data;
};

export const registerBusiness = async (
  data: BusinessRegisterData
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    '/applications/business',
    data
  );

  return response.data;
};

export const getCurrentUser = async (
  token: string
): Promise<AuthUser> => {
  const response = await api.get<UserResponse>(
    '/auth/me',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.user;
};

export const updateCurrentUser = async (
  data: UpdateProfileData
): Promise<AuthUser> => {
  const response = await api.patch<UserResponse>(
    '/auth/me',
    data
  );

  return response.data.user;
};

// Phone numbers

export const getPhoneNumbers = async (): Promise<
  SavedPhoneNumber[]
> => {
  const response = await api.get<PhoneNumbersResponse>(
    '/auth/phone-numbers'
  );

  return response.data.phoneNumbers;
};

export const addPhoneNumber = async (
  data: AddPhoneNumberData
): Promise<SavedPhoneNumber[]> => {
  const response = await api.post<PhoneNumbersResponse>(
    '/auth/phone-numbers',
    data
  );

  return response.data.phoneNumbers;
};

export const updatePhoneNumber = async (
  phoneId: string,
  data: UpdatePhoneNumberData
): Promise<SavedPhoneNumber[]> => {
  const response = await api.patch<PhoneNumbersResponse>(
    `/auth/phone-numbers/${phoneId}`,
    data
  );

  return response.data.phoneNumbers;
};

export const deletePhoneNumber = async (
  phoneId: string
): Promise<SavedPhoneNumber[]> => {
  const response = await api.delete<PhoneNumbersResponse>(
    `/auth/phone-numbers/${phoneId}`
  );

  return response.data.phoneNumbers;
};

export const setPrimaryPhoneNumber = async (
  phoneId: string
): Promise<SavedPhoneNumber[]> => {
  const response = await api.patch<PhoneNumbersResponse>(
    `/auth/phone-numbers/${phoneId}/primary`
  );

  return response.data.phoneNumbers;
};

// Saved delivery addresses

export const getSavedAddresses = async (): Promise<
  SavedAddress[]
> => {
  const response = await api.get<SavedAddressesResponse>(
    '/auth/addresses'
  );

  return response.data.addresses;
};

export const addSavedAddress = async (
  data: AddSavedAddressData
): Promise<SavedAddress[]> => {
  const response = await api.post<SavedAddressesResponse>(
    '/auth/addresses',
    data
  );

  return response.data.addresses;
};

export const updateSavedAddress = async (
  addressId: string,
  data: UpdateSavedAddressData
): Promise<SavedAddress[]> => {
  const response = await api.patch<SavedAddressesResponse>(
    `/auth/addresses/${addressId}`,
    data
  );

  return response.data.addresses;
};

export const deleteSavedAddress = async (
  addressId: string
): Promise<SavedAddress[]> => {
  const response = await api.delete<SavedAddressesResponse>(
    `/auth/addresses/${addressId}`
  );

  return response.data.addresses;
};

export const setDefaultAddress = async (
  addressId: string
): Promise<SavedAddress[]> => {
  const response = await api.patch<SavedAddressesResponse>(
    `/auth/addresses/${addressId}/default`
  );

  return response.data.addresses;
};