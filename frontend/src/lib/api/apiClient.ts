import Swal from 'sweetalert2';

interface ApiErrorResponse {
  message?: string;
  details?: Record<string, string | string[]>;
  error?: string;
}

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  pagination?: any;
  errors?: Record<string, string[]>;
  details?: Record<string, string | string[]>;
}

class ApiClient {
  private baseUrl: string = '/api';
  private token: string | null = null;

  constructor() {
    // Always use local /api routes (Next.js middleware)
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private showError(error: ApiErrorResponse | Error | string, title?: string) {
    let message = 'Something went wrong';
    let details: Record<string, string | string[]> | null = null;

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (typeof error === 'object' && error !== null) {
      const apiError = error as ApiErrorResponse;
      if (apiError.message) {
        message = apiError.message;
      }
      if (apiError.details) {
        details = apiError.details;
      } else if (apiError.error) {
        message = apiError.error;
      }
    }

    // Format validation errors
    let displayMessage = message;
    if (details && typeof details === 'object') {
      const errorLines = Object.entries(details)
        .map(([field, errors]) => {
          const errorArray = Array.isArray(errors) ? errors : [errors];
          return `<strong>${field}:</strong> ${errorArray.join(', ')}`;
        })
        .join('<br/>');

      displayMessage = `${message}<br/><br/>${errorLines}`;
    }

    Swal.fire({
      title: title || 'Error',
      html: displayMessage,
      icon: 'error',
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'OK',
      allowOutsideClick: true,
      allowEscapeKey: true,
    });
  }

  private showSuccess(message: string, title = 'Success') {
    Swal.fire({
      title: title,
      text: message,
      icon: 'success',
      confirmButtonColor: '#16a34a',
      confirmButtonText: 'OK',
      timer: 2000,
      timerProgressBar: true,
    });
  }

  async request<T = any>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      showError?: boolean;
      errorTitle?: string;
      successMessage?: string;
    } = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      showError = true,
      errorTitle,
      successMessage,
    } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const data = (await response.json()) as ApiResponse<T>;

      if (!response.ok) {
        const errorData: ApiErrorResponse = {
          message: data.message || 'Request failed',
          details: data.details || data.errors,
        };

        if (showError) {
          this.showError(errorData, errorTitle);
        }

        throw errorData;
      }

      if (successMessage) {
        this.showSuccess(successMessage);
      }

      return (data.data || data) as T;
    } catch (error) {
      if (error instanceof SyntaxError) {
        const errorData = {
          message: 'Invalid response from server',
        };
        if (showError) {
          this.showError(errorData, errorTitle);
        }
        throw errorData;
      }

      // Re-throw if already an ApiErrorResponse
      if (typeof error === 'object' && error !== null && 'message' in error) {
        throw error;
      }

      const errorData = {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };

      if (showError && !(error instanceof Error && error.message.includes('Swal'))) {
        this.showError(errorData, errorTitle);
      }

      throw errorData;
    }
  }

  get<T = any>(endpoint: string, options?: any) {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  post<T = any>(endpoint: string, body?: any, options?: any) {
    return this.request<T>(endpoint, { method: 'POST', body, ...options });
  }

  put<T = any>(endpoint: string, body?: any, options?: any) {
    return this.request<T>(endpoint, { method: 'PUT', body, ...options });
  }

  delete<T = any>(endpoint: string, options?: any) {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }
}

export const apiClient = new ApiClient();
