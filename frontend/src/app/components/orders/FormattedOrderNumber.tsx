'use client';

import Link from 'next/link';

type FormattedOrderNumberProps = {
  clientId: number | null;
  locationId: number | null;
  orderId: number;
  showLink?: boolean;
};

export default function FormattedOrderNumber({
  clientId,
  locationId,
  orderId,
  showLink = true,
}: FormattedOrderNumberProps) {
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

      {locationId && (
        <>
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
          <span>/</span>
        </>
      )}

      {showLink ? (
        <Link
          href={`/dashboard/orders/${orderId}`}
          className="hover:text-blue-600 hover:underline"
          title="Przejdź do szczegółów zamówienia"
        >
          O{padNumber(orderId, 5)}
        </Link>
      ) : (
        <span>O{padNumber(orderId, 5)}</span>
      )}
    </span>
  );
}
