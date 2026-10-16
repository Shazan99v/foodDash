import api from '../api';

export type CreateOrderItem = {
  food: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type DeliveryInfo = {
  name: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  label?: string;
  latitude?: number | null;
  longitude?: number | null;
  isLiveLocation?: boolean;
};

export type CreateOrderData = {
  items: CreateOrderItem[];
  delivery: DeliveryInfo;
  paymentMethod:
    | 'cash_on_delivery'
    | 'jazzcash'
    | 'easypaisa'
    | 'card';
  customerNote?: string;
};

export const createCustomerOrder = async (
  orderData: CreateOrderData
) => {
  const response = await api.post(
    '/orders',
    orderData
  );

  return response.data;
};

export const getCustomerOrders = async () => {
  const response = await api.get('/orders/my');

  return response.data;
};

export const getCustomerOrder = async (
  orderId: string
) => {
  const response = await api.get(
    `/orders/${orderId}`
  );

  return response.data;
};

export const cancelCustomerOrder = async (
  orderId: string
) => {
  const response = await api.patch(
    `/orders/${orderId}/cancel`
  );

  return response.data;
};