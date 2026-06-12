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
      // Build detailed error message
      let errorMsg = data.message || 'Failed to create user';

      // If there are validation errors, include them
      if (data.details && typeof data.details === 'object') {
        const errors = Object.entries(data.details)
          .map(([field, messages]: [string, any]) => {
            const msgList = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgList.join(', ')}`;
          })
          .join('\n');
        errorMsg = errors || errorMsg;
      }

      throw new Error(errorMsg);
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
      // Build detailed error message
      let errorMsg = data.message || 'Failed to update user';

      // If there are validation errors, include them
      if (data.details && typeof data.details === 'object') {
        const errors = Object.entries(data.details)
          .map(([field, messages]: [string, any]) => {
            const msgList = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgList.join(', ')}`;
          })
          .join('\n');
        errorMsg = errors || errorMsg;
      }

      throw new Error(errorMsg);
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

      // Build detailed error message
      let errorMsg = data.message || 'Failed to delete user';

      // If there are validation errors, include them
      if (data.details && typeof data.details === 'object') {
        const errors = Object.entries(data.details)
          .map(([field, messages]: [string, any]) => {
            const msgList = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgList.join(', ')}`;
          })
          .join('\n');
        errorMsg = errors || errorMsg;
      }

      throw new Error(errorMsg);
    }

    return true;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete user');
  }
}
