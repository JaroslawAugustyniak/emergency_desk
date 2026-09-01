'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

type DateRangeSelectorProps = {
  onDateRangeChange: (fromDate: string, toDate: string) => void;
};

export default function DateRangeSelector({ onDateRangeChange }: DateRangeSelectorProps) {
  const searchParams = useSearchParams();
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const callbackRef = useRef(onDateRangeChange);
  const prevUrlRef = useRef<string>('');

  useEffect(() => {
    callbackRef.current = onDateRangeChange;
  }, [onDateRangeChange]);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDefaultDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      from: formatDate(firstDay),
      to: formatDate(lastDay),
    };
  };

  useEffect(() => {
    const urlFromDate = searchParams.get('from_date');
    const urlToDate = searchParams.get('to_date');
    const urlString = `${urlFromDate}${urlToDate}`;

    if (urlString === prevUrlRef.current) return;
    prevUrlRef.current = urlString;

    if (urlFromDate && urlToDate) {
      setFromDate(urlFromDate);
      setToDate(urlToDate);
    } else {
      const defaults = getDefaultDates();
      setFromDate(defaults.from);
      setToDate(defaults.to);

      setTimeout(() => {
        callbackRef.current(defaults.from, defaults.to);
      }, 0);
    }
  }, [searchParams]);

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setFromDate(newDate);
    onDateRangeChange(newDate, toDate);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setToDate(newDate);
    onDateRangeChange(fromDate, newDate);
  };

  const getMonthYear = (dateStr: string) => {
    const [year, month] = dateStr.split('-').map(Number);
    return { year, month };
  };

  const handlePrevMonth = () => {
    const { year, month } = getMonthYear(fromDate);
    const prevDate = new Date(year, month - 1 - 1, 1);

    const firstDay = prevDate;
    const lastDay = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0);

    const from = formatDate(firstDay);
    const to = formatDate(lastDay);

    onDateRangeChange(from, to);
  };

  const handleNextMonth = () => {
    const { year, month } = getMonthYear(fromDate);
    const nextDate = new Date(year, month - 1 + 1, 1);

    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    if (nextDate < currentMonthStart) {
      const firstDay = nextDate;
      const lastDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0);

      const from = formatDate(firstDay);
      const to = formatDate(lastDay);

      onDateRangeChange(from, to);
    }
  };

  const canNavigateToNext = () => {
    const { year, month } = getMonthYear(fromDate);
    const nextDate = new Date(year, month - 1 + 1, 1);
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return nextDate < currentMonthStart;
  };

  return (
    <div className="flex gap-4 items-end flex-wrap">
      <button
        onClick={handlePrevMonth}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
        title="Poprzedni miesiąc"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Od daty</label>
        <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800">
          <Calendar className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="date"
            value={fromDate}
            onChange={handleFromDateChange}
            className="bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Do daty</label>
        <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800">
          <Calendar className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="date"
            value={toDate}
            onChange={handleToDateChange}
            className="bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <button
        onClick={handleNextMonth}
        disabled={!canNavigateToNext()}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Następny miesiąc"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
