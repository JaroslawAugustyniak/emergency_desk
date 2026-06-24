export type ServiceCategory = {
  id: number;
  client_id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export type CreateServiceCategoryData = {
  client_id: number;
  name: string;
  color: string;
};

export type UpdateServiceCategoryData = {
  name?: string;
  color?: string;
};
