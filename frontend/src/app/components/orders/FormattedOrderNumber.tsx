'use client';

import Link from 'next/link';
import { useSessionContext } from '@/app/components/providers/SessionProvider';

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
  const { role }  = useSessionContext();

  const showClientLink = (role == 'admin' || role == 'client' ? true : false);
  const showLocationLink = (role == 'admin' || role == 'client' ? true : false);
  return (
    <span className="flex items-center gap-1 font-mono">
      {clientId && (
        <>
          {showLink && showClientLink ? (
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
          {showLink && showLocationLink  ? (
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
