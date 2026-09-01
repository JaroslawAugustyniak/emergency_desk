'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { TechnicianRevenueSummary } from '@/lib/actions/technicianReports';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

type TechnicianRevenueListProps = {
  technicians: TechnicianRevenueSummary[];
  fromDate: string;
  toDate: string;
};

export default function TechnicianRevenueList({
  technicians,
  fromDate,
  toDate,
}: TechnicianRevenueListProps) {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');

  const sortedTechnicians = useMemo(() => {
    return [...technicians].sort((a, b) => b.revenue - a.revenue);
  }, [technicians]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (sortedTechnicians.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('noData')}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('technician')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('revenue')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('materialsCost')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('income')}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTechnicians.map((technician) => (
              <tr key={technician.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {technician.name}
                    </p>
                    <p className="text-sm text-gray-500">{technician.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(technician.revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(technician.materials_cost)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-bold text-green-600">
                    {formatCurrency(technician.income)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <Link
                    href={`/dashboard/reports/technician-revenue/${technician.id}?from_date=${fromDate}&to_date=${toDate}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sortedTechnicians.map((technician) => (
            <div
              key={technician.id}
              className="bg-white border border-gray-200 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="mb-3 pb-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  {technician.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{technician.email}</p>
              </div>

              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="text-xs text-gray-500 mb-1">{t('revenue')}</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(technician.revenue)}
                </p>
              </div>

              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="text-xs text-gray-500 mb-1">{t('materialsCost')}</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(technician.materials_cost)}
                </p>
              </div>

              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="text-xs text-gray-500 mb-1">{t('income')}</p>
                <p className="text-sm font-bold text-green-600">
                  {formatCurrency(technician.income)}
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/dashboard/reports/technician-revenue/${technician.id}?from_date=${fromDate}&to_date=${toDate}`}
                  className="flex-1 p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center justify-center text-sm font-medium"
                >
                  {tCommon('details')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
