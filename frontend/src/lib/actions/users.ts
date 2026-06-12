export type CreateUserData = {
  email: string;
  password: string;
  role: string;
  first_name: string;
  last_name: string;
  phone?: string;
};

export type UpdateUserData = {
  email?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  password?: string;
};

export async function createUser(userData: CreateUserData, token: string) {
  try {
    const res = await fetch(`/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to create user');
    }

    return data.data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create user');
  }
}

export async function updateUser(
  userId: number,
  userData: UpdateUserData,
  token: string
) {
  try {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to update user');
    }

    return data.data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update user');
  }
}

export async function deleteUser(userId: number, token: string) {
  try {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to delete user');
    }

    return true;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete user');
  }
}
