export type Client = {
  id: number;
  name: string;
  hash: string;
  created_at: string;
  updated_at: string;
};

export type CreateClientData = {
  name: string;
};

export type UpdateClientData = {
  name?: string;
};

export type ClientFilters = {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: 'id' | 'name' | 'created_at';
  sort_order?: 'asc' | 'desc';
};

export type ClientsListResponse = {
  data: Client[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};
