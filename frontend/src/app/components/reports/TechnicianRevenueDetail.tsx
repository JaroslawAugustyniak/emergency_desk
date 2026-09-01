'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { TechnicianRevenueDetailResponse } from '@/lib/actions/technicianReports';

type TechnicianRevenueDetailProps = {
  data: TechnicianRevenueDetailResponse;
};

export default function TechnicianRevenueDetail({ data }: TechnicianRevenueDetailProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const chartData = useMemo(() => {
    return [
      {
        name: 'Przychód',
        value: Math.round(data.summary.total_revenue * 100) / 100,
      },
      {
        name: 'Koszty materiałów',
        value: Math.round(data.summary.total_materials_cost * 100) / 100,
      },
    ];
  }, [data.summary]);

  const COLORS = ['#22c55e', '#ef4444'];

  const margin = data.summary.total_revenue - data.summary.total_materials_cost;
  const marginPercentage = data.summary.total_revenue > 0
    ? Math.round((margin / data.summary.total_revenue) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Technician Info */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {data.technician.name}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">{data.technician.email}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Przychód</p>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(data.summary.total_revenue)}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-2">Koszty materiałów</p>
          <p className="text-xl font-bold text-red-900 dark:text-red-100">
            {formatCurrency(data.summary.total_materials_cost)}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">Dochód netto</p>
          <p className="text-xl font-bold text-green-900 dark:text-green-100">
            {formatCurrency(data.summary.total_income)}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">Marża</p>
          <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
            {marginPercentage}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Podział przychodu i kosztów
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Statistics */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Statystyki
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Liczba zleceń</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {data.summary.orders_count}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Średni przychód na zlecenie</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(
                  data.summary.orders_count > 0
                    ? data.summary.total_revenue / data.summary.orders_count
                    : 0
                )}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Średni koszt materiałów</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(
                  data.summary.orders_count > 0
                    ? data.summary.total_materials_cost / data.summary.orders_count
                    : 0
                )}
              </span>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="text-slate-600 dark:text-slate-400">Średni dochód na zlecenie</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {formatCurrency(
                  data.summary.orders_count > 0
                    ? data.summary.total_income / data.summary.orders_count
                    : 0
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Szczegóły zleceń ({data.orders.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Nr zlecenia
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Klient
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Kategoria
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Przychód
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Koszty
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Dochód
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                    {order.order_number}
                  </td>
                  <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{order.client}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{order.service_category}</td>
                  <td className="px-6 py-4 text-right text-slate-900 dark:text-slate-100">
                    {formatCurrency(order.revenue)}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-900 dark:text-slate-100">
                    {formatCurrency(order.materials_cost)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(order.income)}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{order.end_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">Brak zleceń dla wybranego okresu</p>
          </div>
        )}
      </div>
    </div>
  );
}
