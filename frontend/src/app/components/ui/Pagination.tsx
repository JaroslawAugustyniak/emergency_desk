'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  buildHref: (page: number) => string;
  i18nKey?: string;
  variant?: 'black' | 'blue';
};

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  buildHref,
  i18nKey = 'page',
  variant = 'black',
}: PaginationProps) {
  const tCommon = useTranslations('common');

  if (totalPages <= 1) {
    return null;
  }

  const bgColorClass = variant === 'blue' ? 'bg-blue-600' : 'bg-black';
  const textColorClass = variant === 'blue' ? 'text-white rounded' : 'text-white';

  return (
    <div className="mt-6 flex items-center justify-between">
      <div className="text-sm text-gray-600">
        {i18nKey === 'page'
          ? `Page ${currentPage} of ${totalPages} (${totalCount} total items)`
          : `Page ${currentPage} of ${totalPages} (${totalCount} total)`}
      </div>

      <div className="flex gap-2">
        {/* Previous Button */}
        {currentPage > 1 ? (
          <Link
            href={buildHref(currentPage - 1)}
            className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {tCommon('previous')}
          </Link>
        ) : (
          <button
            disabled
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            {tCommon('previous')}
          </button>
        )}

        {/* Page Numbers */}
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // Show: first, last, current, and adjacent pages
            const showPage =
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPage) <= 1;

            if (!showPage) {
              // Show '...' only once between groups
              if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return (
                  <span key={page} className="px-2 py-1 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            }

            return page === currentPage ? (
              <span
                key={page}
                className={`px-4 py-1 ${bgColorClass} ${textColorClass} font-medium`}
              >
                {page}
              </span>
            ) : (
              <Link
                key={page}
                href={buildHref(page)}
                className="px-4 py-1 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {page}
              </Link>
            );
          })}
        </div>

        {/* Next Button */}
        {currentPage < totalPages ? (
          <Link
            href={buildHref(currentPage + 1)}
            className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            {tCommon('next')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            disabled
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-gray-400 cursor-not-allowed"
          >
            {tCommon('next')}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}