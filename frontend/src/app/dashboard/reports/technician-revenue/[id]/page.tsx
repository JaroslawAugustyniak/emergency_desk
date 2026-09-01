'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import DateRangeSelector from '@/app/components/reports/DateRangeSelector';
import TechnicianRevenueDetail from '@/app/components/reports/TechnicianRevenueDetail';
import { getTechnicianRevenueDetail } from '@/lib/actions/technicianReports';
import type { TechnicianRevenueDetailResponse } from '@/lib/actions/technicianReports';
import { ArrowLeft } from 'lucide-react';

export default function TechnicianDetailPage() {
  const t = useTranslations();
  const params = useParams();
  const searchParams = useSearchParams();
  const { token, isLoading } = useSessionContext();

  const technicianId = params.id as string;
  const initialFromDate = searchParams.get('from_date') || '';
  const initialToDate = searchParams.get('to_date') || '';

  const [data, setData] = useState<TechnicianRevenueDetailResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fromDate, setFromDate] = useState<string>(initialFromDate);
  const [toDate, setToDate] = useState<string>(initialToDate);
  const [error, setError] = useState<string | null>(null);

  const handleDateRangeChange = async (from: string, to: string) => {
    setFromDate(from);
    setToDate(to);
    setError(null);

    if (!token || !technicianId) return;

    try {
      setIsLoadingData(true);
      const result = await getTechnicianRevenueDetail(technicianId, from, to, token);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd podczas pobierania danych';
      setError(errorMessage);
      console.error('Error fetching technician detail:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Load initial data if dates provided via search params
  useEffect(() => {
    if (initialFromDate && initialToDate && token && !isLoading) {
      handleDateRangeChange(initialFromDate, initialToDate);
    }
  }, [token, isLoading, initialFromDate, initialToDate, technicianId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-slate-600 dark:text-slate-400">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/dashboard/reports/technician-revenue"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Raport technika
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Szczegółowy raport przychodów i kosztów
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Wybierz zakres dat
        </h2>
        <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoadingData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
          <p className="text-blue-800 dark:text-blue-200">Ładowanie danych...</p>
        </div>
      )}

      {/* Content */}
      {!isLoadingData && data && <TechnicianRevenueDetail data={data} />}
    </div>
  );
}
