import { apiClient } from '@/lib/api/apiClient';

export type LocationFilters = {
  page?: number;
  per_page?: number;
  search?: string;
  client_id?: number;
  sort_by?: 'id' | 'name' | 'address' | 'city' | 'created_at';
  sort_order?: 'asc' | 'desc';
};

export type LocationsListResponse = {
  data: Location[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type CreateLocationData = {
  name: string;
  address: string;
  number: string;
  zip: string;
  city: string;
  country?: string;
  nip?: string;
  client_id: number;
  user_id?: number | null;
};

export type UpdateLocationData = {
  name?: string;
  address?: string;
  number?: string;
  zip?: string;
  city?: string;
  country?: string;
  nip?: string;
  user_id?: number | null;
};

export type Location = {
  id: number;
  name: string;
  address: string;
  number: string;
  zip: string;
  city: string;
  country: string;
  nip?: string;
  client_id: number;
  user_id?: number | null;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  created_at: string;
  updated_at: string;
};

export async function createLocation(data: CreateLocationData, token: string): Promise<Location> {
  apiClient.setToken(token);
  return apiClient.post('/locations', data);
}

export async function updateLocation(
  locationId: number,
  data: UpdateLocationData,
  token: string
): Promise<Location> {
  apiClient.setToken(token);
  return apiClient.put(`/locations/${locationId}`, data);
}

export async function deleteLocation(locationId: number, token: string): Promise<void> {
  apiClient.setToken(token);
  return apiClient.delete(`/locations/${locationId}`);
}

export async function getLocations(
  filters?: LocationFilters,
  token?: string
): Promise<LocationsListResponse> {
  const params = new URLSearchParams();

  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.per_page) params.append('per_page', String(filters.per_page));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.client_id) params.append('client_id', String(filters.client_id));
  if (filters?.sort_by) params.append('sort_by', filters.sort_by);
  if (filters?.sort_order) params.append('sort_order', filters.sort_order);

  const queryString = params.toString();
  const url = queryString ? `/api/locations?${queryString}` : '/api/locations';

  const res = await fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error('Failed to fetch locations');
  }

  return res.json();
}

export async function getLocationsByClient(
  clientId: number,
  token?: string
): Promise<LocationsListResponse> {
  return getLocations({ client_id: clientId, per_page: 100 }, token);
}
