export type User = {
  id: number;
  email: string;
  role: 'admin' | 'client' | 'technician' | 'tech_manager';
  status: 'active' | 'blocked';
  first_name: string;
  last_name: string;
  phone?: string | null;
  client_id?: number | null;
  email_verified_at?: string | null;
  created_at: string;
  updated_at: string;
};
