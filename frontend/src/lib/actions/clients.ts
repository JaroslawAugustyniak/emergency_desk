import { apiClient } from '@/lib/api/apiClient';

export type CreateClientData = {
  name: string;
};

export type UpdateClientData = {
  name?: string;
};

export async function createClient(clientData: CreateClientData, token: string) {
  apiClient.setToken(token);
  return apiClient.post('/clients', clientData);
}

export async function updateClient(
  clientId: number,
  clientData: UpdateClientData,
  token: string
) {
  apiClient.setToken(token);
  return apiClient.put(`/clients/${clientId}`, clientData);
}

export async function deleteClient(clientId: number, token: string) {
  apiClient.setToken(token);
  return apiClient.delete(`/clients/${clientId}`);
}

export async function regenerateClientHash(clientId: number, token: string) {
  apiClient.setToken(token);
  return apiClient.post(`/clients/${clientId}/regenerate-hash`, {});
}
