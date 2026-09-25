'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { useDashboardStats } from '@/hooks/useDashboardStats';


import { Clock, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  
  const { user } = useSessionContext();
  const { stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  

  // Auto-refresh orders every 30 seconds (only if no modal is open)

  


  return (
    <div className="">
      <h1 className="text-2xl font-bold md:mb-8">
        {t('welcome', {name: user?.first_name+' '+user?.last_name || 'Gościu'})}
      </h1>

      <p className="text-slate-600 mb-8">
        {t('summary')}
      </p>

      {statsError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">Error loading statistics: {statsError}</p>
        </div>
      )}

      {/* Summary Stats Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Aktywne zlecenia */}
        <div className="bg-slate-50 rounded-lg shadow-sm p-6 relative">
          <div className="flex justify-between items-start mb-6">
            <p className="text-slate-600 text-sm">Aktywne zlecenia</p>
            <Clock className="w-12 h-12 text-slate-400 absolute right-3" />
          </div>
          <div className="text-4xl font-bold text-slate-900 text-center">
            {statsLoading ? '-' : stats.active}
          </div>
        </div>

        {/* W trakcie */}
        <div className="bg-slate-50 rounded-lg shadow-sm p-6 relative">
          <div className="flex justify-between items-start mb-6">
            <p className="text-slate-600 text-sm">W trakcie</p>
            <Zap className="w-12 h-12 text-slate-400 absolute right-3" />
          </div>
          <div className="text-4xl font-bold text-slate-900 text-center">
            {statsLoading ? '-' : stats.inProgress}
          </div>
        </div>

        {/* Zakończone */}
        <div className="bg-slate-50 rounded-lg shadow-sm p-6 relative">
          <div className="flex justify-between items-start mb-6">
            <p className="text-slate-600 text-sm">Zakończone</p>
            <CheckCircle2 className="w-12 h-12 text-slate-400 absolute right-3" />
          </div>
          <div className="text-4xl font-bold text-slate-900 text-center">
            {statsLoading ? '-' : stats.completed}
          </div>
        </div>

        {/* Awaryjne */}
        <div className="bg-slate-50 rounded-lg shadow-sm p-6 relative">
          <div className="flex justify-between items-start mb-6">
            <p className="text-slate-600 text-sm">Awaryjne</p>
            <AlertCircle className="w-12 h-12 text-slate-400 absolute right-3" />
          </div>
          <div className="text-4xl font-bold text-slate-900 text-center">
            {statsLoading ? '-' : stats.emergency}
          </div>
        </div>
      </div>

      

      <div className="flex flex-col md:flex-row lg:flex-row lg:items-start gap-6">
        {/* Stoper */}
      </div>
    </div>
  );
}
