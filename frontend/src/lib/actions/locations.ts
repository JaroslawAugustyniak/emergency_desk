import { apiClient } from '@/lib/api/apiClient';

export type CreateLocationData = {
  name: string;
  address: string;
  number: string;
  zip: string;
  city: string;
  country?: string;
  client_id: number;
};

export type UpdateLocationData = {
  name?: string;
  address?: string;
  number?: string;
  zip?: string;
  city?: string;
  country?: string;
};

type Location = {
  id: number;
  name: string;
  address: string;
  number: string;
  zip: string;
  city: string;
  country: string;
  client_id: number;
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
