'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import DateRangeSelector from '@/app/components/reports/DateRangeSelector';
import TechnicianRevenueList from '@/app/components/reports/TechnicianRevenueList';
import { getTechnicianRevenueSummary } from '@/lib/actions/technicianReports';
import type { TechnicianRevenueSummary } from '@/lib/actions/technicianReports';
import BackButton  from '@/app/components/ui/BackButton';

export default function TechnicianRevenueReportPage() {
  const t = useTranslations('reports');
  const router = useRouter();
  const { token, isLoading } = useSessionContext();
  const [technicians, setTechnicians] = useState<TechnicianRevenueSummary[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleDateRangeChange = useCallback((from: string, to: string) => {
    setFromDate(from);
    setToDate(to);
    setError(null);

    const params = new URLSearchParams();
    params.set('from_date', from);
    params.set('to_date', to);
    router.push(`/dashboard/reports/technician-revenue?${params.toString()}`);
  }, [router]);

  useEffect(() => {
    if (!token || isLoading || !fromDate || !toDate) return;

    const timer = setTimeout(() => {
      const fetchData = async () => {
        try {
          setIsLoadingData(true);
          const data = await getTechnicianRevenueSummary(fromDate, toDate, token);
          console.log('Fetched data:', data);
          setTechnicians(data.data || []);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Błąd podczas pobierania danych';
          setError(errorMessage);
          console.error('Error fetching technician revenues:', err);
        } finally {
          setIsLoadingData(false);
        }
      };

      fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [fromDate, toDate, token]);

  if (isLoading || isLoadingData) {
    return (
      <div className="px-2 -mt-18">
        <h1 className="text-2xl font-bold mb-8">{t('technicianRevenueReport')}</h1>
        <div className="text-center py-8">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="px-2 -mt-18">
      <h1 className="text-2xl font-bold mb-8">{t('technicianRevenueReport')}</h1>

      {/* Date Range Selector */}
      <div className="flex items-center justify-between mb-6">
        <BackButton />
        <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Content */}
      {fromDate && toDate && (
        <TechnicianRevenueList
          technicians={technicians}
          fromDate={fromDate}
          toDate={toDate}
        />
      )}
    </div>
  );
}
