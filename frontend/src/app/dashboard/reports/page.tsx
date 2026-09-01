'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const t = useTranslations('reports');

  const reports = [
    {
      title: t('technicianRevenueReport'),
      description: 'Przychody i koszty materiałów dla każdego technika w wybranym okresie',
      href: '/dashboard/reports/technician-revenue',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {t('title')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Wybierz raport do wyświetlenia
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.href}
              href={report.href}
              className="group bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-slate-200 dark:border-slate-700"
            >
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${report.color} mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {report.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {report.description}
              </p>
              <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                Otwórz
                <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
