export type CreateClientData = {
  name: string;
};

export type UpdateClientData = {
  name?: string;
};

export async function createClient(clientData: CreateClientData, token: string) {
  try {
    const res = await fetch(`/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(clientData),
    });

    const data = await res.json();

    if (!res.ok) {
      let errorMsg = data.message || 'Failed to create client';

      if (data.errors && typeof data.errors === 'object') {
        const errors = Object.entries(data.errors)
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
    throw new Error(error.message || 'Failed to create client');
  }
}

export async function updateClient(
  clientId: number,
  clientData: UpdateClientData,
  token: string
) {
  try {
    const res = await fetch(`/api/clients/${clientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(clientData),
    });

    const data = await res.json();

    if (!res.ok) {
      let errorMsg = data.message || 'Failed to update client';

      if (data.errors && typeof data.errors === 'object') {
        const errors = Object.entries(data.errors)
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
    throw new Error(error.message || 'Failed to update client');
  }
}

export async function deleteClient(clientId: number, token: string) {
  try {
    const res = await fetch(`/api/clients/${clientId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      let errorMsg = data.message || 'Failed to delete client';

      if (data.errors && typeof data.errors === 'object') {
        const errors = Object.entries(data.errors)
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
    throw new Error(error.message || 'Failed to delete client');
  }
}

export async function regenerateClientHash(clientId: number, token: string) {
  try {
    const res = await fetch(`/api/clients/${clientId}/regenerate-hash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to regenerate hash');
    }

    return data.data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to regenerate hash');
  }
}
