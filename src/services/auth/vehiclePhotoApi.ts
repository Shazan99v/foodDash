import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export type VehiclePhotoUploadResponse = {
  success: boolean;
  message: string;
  photoUrl: string;
};

const uploadApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const uploadVehiclePhoto = async (
  formData: FormData
): Promise<VehiclePhotoUploadResponse> => {
  const response =
    await uploadApi.post<VehiclePhotoUploadResponse>(
      '/uploads/vehicle',
      formData
    );

  return response.data;
};