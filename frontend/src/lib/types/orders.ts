export type Order = {
  id: number;
  order_number: string;
  client_id: number;
  client: {
    id: number;
    name: string;
  } | null;
  technician_id: number | null;
  technician: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  location_id: number;
  location: {
    id: number;
    street_no: string;
    apartment_no: string | null;
    city: string;
  } | null;
  service_category_id: number;
  service_category: {
    id: number;
    name: string;
    color: string;
  } | null;
  status: 'new' | 'assigned' | 'in_progress' | 'paused' | 'completed' | 'invoiced';
  description: string | null;
  stop_reason: string | null;
  vat_rate: number;
  is_emergency: boolean;
  client_ref_no: string | null;
  invoice_no: string | null;
  price_total: number | null;
  work_report: string | null;
  order_date: string;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateOrderData = {
  client_id: number;
  location_id: number;
  service_category_id: number;
  description?: string | null;
  is_emergency?: boolean;
  client_ref_no?: string | null;
  order_date: string;
  vat_rate?: number;
};

export type UpdateOrderData = {
  description?: string;
  client_ref_no?: string | null;
  vat_rate?: number;
  is_emergency?: boolean;
  work_report?: string | null;
  price_total?: number | null;
};

export type OrderFilters = {
  page?: number;
  per_page?: number;
  search?: string;
  client_id?: number;
  location_id?: number;
  status?: 'new' | 'assigned' | 'in_progress' | 'paused' | 'completed' | 'invoiced';
  sort_by?: 'id' | 'order_number' | 'status' | 'order_date' | 'created_at';
  sort_order?: 'asc' | 'desc';
};

export type OrdersListResponse = {
  data: Order[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type ChangeStatusData = {
  status: 'new' | 'assigned' | 'in_progress' | 'paused' | 'completed' | 'invoiced';
  stop_reason?: string | null;
};

export type AssignTechnicianData = {
  technician_id: number;
};
