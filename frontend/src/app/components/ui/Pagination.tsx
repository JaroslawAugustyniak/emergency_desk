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
  const page = Number(currentPage);
  const pages = Number(totalPages);

  if (pages <= 1) {
    return null;
  }

  const bgColorClass = variant === 'blue' ? 'bg-blue-600' : 'bg-black';
  const textColorClass = variant === 'blue' ? 'text-white rounded' : 'text-white';

  return (
    <div className="mt-6 flex items-center justify-between">
      <div className="text-sm text-gray-600">
        {i18nKey === 'page'
          ? `Page ${page} of ${pages} (${totalCount} total items)`
          : `Page ${page} of ${pages} (${totalCount} total)`}
      </div>

      <div className="flex gap-2">
        {/* Previous Button */}
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
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
          {Array.from({ length: pages }, (_, i) => i + 1).map((pageNum) => {
            // Show: first, last, current, and adjacent pages
            const showPage =
              pageNum === 1 ||
              pageNum === pages ||
              Math.abs(pageNum - page) <= 1;

            if (!showPage) {
              // Show '...' only once between groups
              if (
                pageNum === page - 2 ||
                pageNum === page + 2
              ) {
                return (
                  <span key={pageNum} className="px-2 py-1 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            }

            return pageNum === page ? (
              <span
                key={pageNum}
                className={`px-4 py-1 ${bgColorClass} ${textColorClass} font-medium`}
              >
                {pageNum}
              </span>
            ) : (
              <Link
                key={pageNum}
                href={buildHref(pageNum)}
                className="px-4 py-1 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {pageNum}
              </Link>
            );
          })}
        </div>

        {/* Next Button */}
        {page < pages ? (
          <Link
            href={buildHref(page + 1)}
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