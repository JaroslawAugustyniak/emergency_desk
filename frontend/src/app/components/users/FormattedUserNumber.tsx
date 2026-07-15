'use client';

import Link from 'next/link';

type FormattedUserNumberProps = {
  clientId: number | null | undefined;
  userId: number;
  showLink?: boolean;
};

export default function FormattedUserNumber({
  clientId,
  userId,
  showLink = true,
}: FormattedUserNumberProps) {
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
          href={`/dashboard/users/${userId}`}
          className="hover:text-blue-600 hover:underline"
          title="Przejdź do szczegółów punktu"
        >
          U{padNumber(userId, 3)}
        </Link>
      ) : (
        <span>U{padNumber(userId, 3)}</span>
      )}
    </span>
  );
}
