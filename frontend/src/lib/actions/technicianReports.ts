export type TechnicianRevenueSummary = {
  id: number;
  name: string;
  email: string;
  revenue: number;
  materials_cost: number;
  income: number;
  orders_count: number;
};

export type TechnicianRevenueSummaryResponse = {
  status: string;
  data: TechnicianRevenueSummary[];
  period: {
    from_date: string;
    to_date: string;
  };
};

export type TechnicianRevenueDetail = {
  id: number;
  order_number: string;
  client: string;
  service_category: string;
  location: string;
  revenue: number;
  materials_cost: number;
  income: number;
  end_at: string;
  status: string;
};

export type TechnicianRevenueDetailResponse = {
  status: string;
  technician: {
    id: number;
    name: string;
    email: string;
  };
  summary: {
    total_revenue: number;
    total_materials_cost: number;
    total_income: number;
    orders_count: number;
  };
  orders: TechnicianRevenueDetail[];
  period: {
    from_date: string;
    to_date: string;
  };
};

export async function getTechnicianRevenueSummary(
  fromDate: string,
  toDate: string,
  token: string
): Promise<TechnicianRevenueSummaryResponse> {
  const params = new URLSearchParams({
    from_date: fromDate,
    to_date: toDate,
  });

  const res = await fetch(`/api/technician-reports/revenue-summary?${params.toString()}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error('Failed to fetch technician revenue summary');
  }

  return res.json();
}

export async function getTechnicianRevenueDetail(
  technicianId: string | number,
  fromDate: string,
  toDate: string,
  token: string
): Promise<TechnicianRevenueDetailResponse> {
  const params = new URLSearchParams({
    from_date: fromDate,
    to_date: toDate,
  });

  const res = await fetch(`/api/technician-reports/revenue/${technicianId}?${params.toString()}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error('Failed to fetch technician revenue detail');
  }

  return res.json();
}
