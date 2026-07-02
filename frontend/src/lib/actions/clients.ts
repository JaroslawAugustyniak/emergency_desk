import { Client, CreateClientData, UpdateClientData, ClientFilters, ClientsListResponse } from '@/lib/types/clients';

export async function getClients(
  filters?: ClientFilters,
  token?: string
): Promise<ClientsListResponse> {
  const params = new URLSearchParams();

  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.per_page) params.append('per_page', String(filters.per_page));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.sort_by) params.append('sort_by', filters.sort_by);
  if (filters?.sort_order) params.append('sort_order', filters.sort_order);

  const queryString = params.toString();
  const url = queryString ? `/api/clients?${queryString}` : '/api/clients';

  const res = await fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error('Failed to fetch clients');
  }

  return res.json();
}

export async function getClient(
  clientId: number,
  token?: string
): Promise<{ data: Client }> {
  const res = await fetch(`/api/clients/${clientId}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error('Failed to fetch client');
  }

  return res.json();
}

export async function createClient(
  data: CreateClientData,
  token: string
): Promise<Client> {
  const res = await fetch('/api/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || error.message || 'Failed to create client');
  }

  const response = await res.json();
  return response.data;
}

export async function updateClient(
  clientId: number,
  data: UpdateClientData,
  token: string
): Promise<Client> {
  const res = await fetch(`/api/clients/${clientId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || error.message || 'Failed to update client');
  }

  const response = await res.json();
  return response.data;
}

export async function deleteClient(
  clientId: number,
  token: string
): Promise<void> {
  const res = await fetch(`/api/clients/${clientId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || error.message || 'Failed to delete client');
  }
}

export async function regenerateClientHash(
  clientId: number,
  token: string
): Promise<Client> {
  const res = await fetch(`/api/clients/${clientId}/regenerate-hash`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || error.message || 'Failed to regenerate hash');
  }

  const response = await res.json();
  return response.data;
}
