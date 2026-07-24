export type UserRole = 'admin' | 'client' | 'technician';

export const is_admin = (role: UserRole | null): boolean => {
  return role === 'admin';
};

export const is_client = (role: UserRole | null): boolean => {
  return role === 'client';
};

export const is_technician = (role: UserRole | null): boolean => {
  return role === 'technician';
};
