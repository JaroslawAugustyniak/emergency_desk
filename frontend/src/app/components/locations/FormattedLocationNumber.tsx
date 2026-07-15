'use client';

import Link from 'next/link';

type FormattedLocationNumberProps = {
  clientId: number | null;
  locationId: number;
  showLink?: boolean;
};

export default function FormattedLocationNumber({
  clientId,
  locationId,
  showLink = true,
}: FormattedLocationNumberProps) {
  const padNumber = (num: number, length: number) => String(num).padStart(length, '0');

  return (
    <span className="flex items-center gap-1 font-mono">
      {clientId && (
        <>
          {showLink ? (
            <Link
              href={`/dashboard/clients/${clientId}`}
              className="hover:text-blue-600 hover:underline"
              title="Przejdź do szczegółów klienta"
            >
              C{padNumber(clientId, 3)}
            </Link>
          ) : (
            <span>C{padNumber(clientId, 3)}</span>
          )}
          <span>/</span>
        </>
      )}

      {showLink ? (
        <Link
          href={`/dashboard/locations/${locationId}`}
          className="hover:text-blue-600 hover:underline"
          title="Przejdź do szczegółów punktu"
        >
          P{padNumber(locationId, 3)}
        </Link>
      ) : (
        <span>P{padNumber(locationId, 3)}</span>
      )}
    </span>
  );
}
