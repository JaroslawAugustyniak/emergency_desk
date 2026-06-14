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
  const response = await fetch('/api/locations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create location');
  }

  const result = await response.json();
  return result.data;
}

export async function updateLocation(
  locationId: number,
  data: UpdateLocationData,
  token: string
): Promise<Location> {
  const response = await fetch(`/api/locations/${locationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update location');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteLocation(locationId: number, token: string): Promise<void> {
  const response = await fetch(`/api/locations/${locationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete location');
  }
}
