
import axios, {
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getAuthToken } from './auth/authStorage';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAuthToken();

    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    // PART 2 CONTINUES BELOW

    // Let the browser or Axios generate the multipart boundary.
    const isFormData =
      typeof FormData !== 'undefined' &&
      config.data instanceof FormData;

    if (isFormData) {
      config.headers.delete('Content-Type');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// PART 3 CONTINUES BELOW

export default api;
