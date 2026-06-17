import { useEffect } from 'react';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { apiClient } from '@/lib/api/apiClient';

export function useApi() {
  const { token } = useSessionContext();

  useEffect(() => {
    apiClient.setToken(token);
  }, [token]);

  return apiClient;
}
