import api from '../api';

export const getAvailableRiderOrders = async () => {
  const response = await api.get(
    '/rider/orders/available'
  );

  return response.data;
};

export const getMyRiderOrders = async () => {
  const response = await api.get(
    '/rider/orders/my-orders'
  );

  return response.data;
};

export const acceptRiderOrder = async (
  orderId: string
) => {
  const response = await api.patch(
    `/rider/orders/${orderId}/accept`
  );

  return response.data;
};

export const pickupRiderOrder = async (
  orderId: string
) => {
  const response = await api.patch(
    `/rider/orders/${orderId}/pickup`
  );

  return response.data;
};

export const deliverRiderOrder = async (
  orderId: string
) => {
  const response = await api.patch(
    `/rider/orders/${orderId}/deliver`
  );

  return response.data;
};