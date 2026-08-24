export type UserRole = 'admin' | 'client' | 'technician' | 'tech_manager';

export const is_admin = (role: UserRole | null): boolean => {
  return role === 'admin';
};

export const is_client = (role: UserRole | null): boolean => {
  return role === 'client';
};

export const is_technician = (role: UserRole | null): boolean => {
  return role === 'technician';
};

export const is_tech_manager = (role: UserRole | null): boolean => {
  return role === 'tech_manager';
};
