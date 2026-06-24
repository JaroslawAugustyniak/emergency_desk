import { ServiceCategory, CreateServiceCategoryData, UpdateServiceCategoryData } from '@/lib/types/serviceCategories';

export async function getServiceCategories(
  clientId: number,
  token: string,
  page: number = 1,
  perPage: number = 100
): Promise<{
  data: ServiceCategory[];
  pagination: { page: number; per_page: number; total: number; last_page: number };
}> {
  const res = await fetch(
    `/api/service-categories?client_id=${clientId}&page=${page}&per_page=${perPage}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch service categories');
  }

  return res.json();
}

export async function createServiceCategory(
  data: CreateServiceCategoryData,
  token: string
): Promise<ServiceCategory> {
  const res = await fetch('/api/service-categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || error.message || 'Failed to create service category');
  }

  const response = await res.json();
  return response.data;
}

export async function updateServiceCategory(
  categoryId: number,
  data: UpdateServiceCategoryData,
  token: string
): Promise<ServiceCategory> {
  console.log('updateServiceCategory:', { categoryId, data, token });

  const res = await fetch(`/api/service-categories/${categoryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  console.log('updateServiceCategory response:', { status: res.status, ok: res.ok });

  const response = await res.json();
  console.log('updateServiceCategory parsed response:', response);

  if (!res.ok) {
    const errorMsg = response.error || response.message || 'Failed to update service category';
    throw new Error(errorMsg);
  }

  return response.data;
}

export async function deleteServiceCategory(
  categoryId: number,
  token: string
): Promise<void> {
  const res = await fetch(`/api/service-categories/${categoryId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || error.message || 'Failed to delete service category');
  }
}
