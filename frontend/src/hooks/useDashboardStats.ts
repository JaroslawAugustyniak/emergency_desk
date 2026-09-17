import { useState, useEffect, useCallback } from 'react';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { getDashboardStats, type DashboardStats } from '@/lib/actions/orders';

export function useDashboardStats() {
  const { token } = useSessionContext();
  const [stats, setStats] = useState<DashboardStats>({
    active: 0,
    inProgress: 0,
    completed: 0,
    emergency: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!token) {
      console.warn('No token available for fetching dashboard stats');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const stats = await getDashboardStats(token);
      setStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching dashboard stats:', err);
      setStats({
        active: 0,
        inProgress: 0,
        completed: 0,
        emergency: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token, fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}
