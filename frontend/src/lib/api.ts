const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.starter.localhost';

export class ApiClient {
  private token: string | null = null;
  private role: 'admin' | 'client' | 'technician' | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
      this.role = localStorage.getItem('user_role') as 'admin' | 'client' | 'technician' | null;
    }
  }

  setCredentials(token: string | null, role: 'admin' | 'client' | 'technician' | null) {
    this.token = token;
    this.role = role;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private getOrdersPath(): string {
    switch (this.role) {
      case 'client':
        return `${API_URL}/api/client/orders`;
      case 'technician':
        return `${API_URL}/api/technician/orders`;
      case 'admin':
      default:
        return `${API_URL}/api/orders`;
    }
  }

  async getOrders(params?: Record<string, string | number>) {
    const url = new URL(this.getOrdersPath());
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return response.json();
  }

  async getOrder(orderId: string | number) {
    const url = `${this.getOrdersPath()}/${orderId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return response.json();
  }

  async createOrder(data: Record<string, unknown>) {
    const response = await fetch(this.getOrdersPath(), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async updateOrder(orderId: string | number, data: Record<string, unknown>) {
    const url = `${this.getOrdersPath()}/${orderId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async changeOrderStatus(orderId: string | number, status: string, stopReason?: string) {
    const url = `${this.getOrdersPath()}/${orderId}/status`;
    const data: Record<string, string> = { status };
    if (stopReason) {
      data.stop_reason = stopReason;
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async getLocations(params?: Record<string, string | number>) {
    let url: string;

    if (this.role === 'client') {
      url = `${API_URL}/api/client/locations`;
    } else {
      url = `${API_URL}/api/locations`;
    }

    const urlObj = new URL(url);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(urlObj.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return response.json();
  }

  async getServiceCategories() {
    let url: string;

    if (this.role === 'client') {
      url = `${API_URL}/api/client/service-categories`;
    } else {
      url = `${API_URL}/api/service-categories`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return response.json();
  }
}

export const apiClient = new ApiClient();
