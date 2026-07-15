export type Technician = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
};

export type TechniciansResponse = {
  data: Technician[];
};

export async function getTechnicians(token: string): Promise<TechniciansResponse> {
  const res = await fetch('/api/users/technicians', {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error('Failed to fetch technicians');
  }

  return res.json();
}
