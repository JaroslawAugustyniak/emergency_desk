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


import { useTranslations } from 'next-intl';

import { TrendingUp, TrendingDown, BarChart3, Siren } from 'lucide-react';

import { TechnicianRevenueDetailResponse } from '@/lib/actions/technicianReports';

type TechnicianRevenueDetailProps = {
  data: TechnicianRevenueDetailResponse;
};

export default function TechnicianRevenueDetail({ data }: TechnicianRevenueDetailProps) {

  const t = useTranslations('reports');
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {data.technician.name}
        </h2>
        <p className="text-slate-600">{data.technician.email}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        

        <div className="bg-slate-50 rounded-lg shadow-sm p-6 relative">
          <div className="flex justify-between items-start mb-6">
            <p className="text-slate-600 text-sm">Przychód</p>
            <TrendingUp className="w-12 h-12 text-green-500 absolute right-3" />
          </div>
          <div className="text-4xl font-bold text-slate-900 text-center">{formatCurrency(data.summary.total_revenue)}</div>
        </div>

        <div className="bg-slate-50 rounded-lg shadow-sm p-6 relative">
          <div className="flex justify-between items-start mb-6">
            <p className="text-slate-600 text-sm">Koszty materiałów</p>
            <TrendingDown className="w-12 h-12 text-red-500 absolute right-3" />
          </div>
          <div className="text-4xl font-bold text-slate-900 text-center">{formatCurrency(data.summary.total_materials_cost)}</div>
        </div>

        <div className="bg-slate-50 rounded-lg shadow-sm p-6 relative">
          <div className="flex justify-between items-start mb-6">
            <p className="text-slate-600 text-sm">Dochód netto</p>
            <BarChart3 className="w-12 h-12 text-blue-500 absolute right-3" />
          </div>
          <div className="text-4xl font-bold text-slate-900 text-center">{formatCurrency(data.summary.total_income)}</div>
        </div>

        <div className="bg-slate-50 rounded-lg shadow-sm p-6 relative">
          <div className="flex justify-between items-start mb-6">
            <p className="text-slate-600 text-sm">{t('emergency')}</p>
            <Siren className="w-12 h-12 text-red-500 absolute right-3" />
          </div>
          <div className="text-4xl font-bold text-slate-900 text-center">{data.summary.emergency}</div>
        </div>

      

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
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
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Statystyki
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-200 ">
              <span className="text-slate-600 ">Liczba zleceń</span>
              <span className="font-bold text-slate-900 ">
                {data.summary.orders_count}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-200 ">
              <span className="text-slate-600 ">Średni przychód na zlecenie</span>
              <span className="font-bold text-slate-900 ">
                {formatCurrency(
                  data.summary.orders_count > 0
                    ? data.summary.total_revenue / data.summary.orders_count
                    : 0
                )}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-200 ">
              <span className="text-slate-600 ">Średni koszt materiałów</span>
              <span className="font-bold text-slate-900 ">
                {formatCurrency(
                  data.summary.orders_count > 0
                    ? data.summary.total_materials_cost / data.summary.orders_count
                    : 0
                )}
              </span>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="text-slate-600 ">Średni dochód na zlecenie</span>
              <span className="font-bold text-green-600 ">
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
      <div className="bg-white  rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-slate-200 ">
          <h3 className="text-lg font-semibold text-slate-900 ">
            Szczegóły zleceń ({data.orders.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 ">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 ">
                  Nr zlecenia
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 ">
                  Klient
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 ">
                  Kategoria
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 ">
                  Przychód
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 ">
                  Koszty
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 ">
                  Dochód
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 ">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900 ">
                    {order.order_number}
                  </td>
                  <td className="px-6 py-4 text-slate-900 ">{order.client}</td>
                  <td className="px-6 py-4 text-slate-600 ">{order.service_category}</td>
                  <td className="px-6 py-4 text-right text-slate-900 ">
                    {formatCurrency(order.revenue)}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-900 ">
                    {formatCurrency(order.materials_cost)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-green-600 ">
                    {formatCurrency(order.income)}
                  </td>
                  <td className="px-6 py-4 text-slate-600 ">{order.end_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 ">Brak zleceń dla wybranego okresu</p>
          </div>
        )}
      </div>
    </div>
  );
}
