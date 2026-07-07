import { Order, CreateOrderData, UpdateOrderData, OrderFilters, OrdersListResponse, ChangeStatusData, AssignTechnicianData } from '@/lib/types/orders';

export async function getOrders(
  filters?: OrderFilters,
  token?: string
): Promise<OrdersListResponse> {
  const params = new URLSearchParams();

  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.per_page) params.append('per_page', String(filters.per_page));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.client_id) params.append('client_id', String(filters.client_id));
  if (filters?.location_id) params.append('location_id', String(filters.location_id));
  if (filters?.status) params.append('status', filters.status);
  if (filters?.sort_by) params.append('sort_by', filters.sort_by);
  if (filters?.sort_order) params.append('sort_order', filters.sort_order);

  const queryString = params.toString();
  const url = queryString ? `/api/orders?${queryString}` : '/api/orders';

  const res = await fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error('Failed to fetch orders');
  }

  return res.json();
}

export async function getOrder(
  orderId: number,
  token?: string
): Promise<{ data: Order }> {
  const res = await fetch(`/api/orders/${orderId}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error('Failed to fetch order');
  }

  return res.json();
}

export async function createOrder(
  data: CreateOrderData,
  token: string
): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.validationError || error.error || error.message || 'Failed to create order');
  }

  const response = await res.json();
  return response.data;
}

export async function updateOrder(
  orderId: number,
  data: UpdateOrderData,
  token: string
): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.validationError || error.error || error.message || 'Failed to update order');
  }

  const response = await res.json();
  return response.data;
}

export async function deleteOrder(
  orderId: number,
  token: string
): Promise<void> {
  const res = await fetch(`/api/orders/${orderId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.validationError || error.error || error.message || 'Failed to delete order');
  }
}

export async function changeOrderStatus(
  orderId: number,
  data: ChangeStatusData,
  token: string
): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.validationError || error.error || error.message || 'Failed to change order status');
  }

  const response = await res.json();
  return response.data;
}

export async function assignTechnician(
  orderId: number,
  data: AssignTechnicianData,
  token: string
): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}/assign-technician`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.validationError || error.error || error.message || 'Failed to assign technician');
  }

  const response = await res.json();
  return response.data;
}
