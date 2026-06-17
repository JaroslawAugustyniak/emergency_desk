import { apiClient } from '@/lib/api/apiClient';

export type CreateUserData = {
  email: string;
  password: string;
  role: string;
  first_name: string;
  last_name: string;
  phone?: string;
  client_id?: number;
};

export type UpdateUserData = {
  email?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  password?: string;
  client_id?: number;
};

export async function createUser(userData: CreateUserData, token: string) {
  apiClient.setToken(token);
  return apiClient.post('/users', userData);
}

export async function updateUser(
  userId: number,
  userData: UpdateUserData,
  token: string
) {
  apiClient.setToken(token);
  return apiClient.put(`/users/${userId}`, userData);
}

export async function deleteUser(userId: number, token: string) {
  apiClient.setToken(token);
  return apiClient.delete(`/users/${userId}`);
}
