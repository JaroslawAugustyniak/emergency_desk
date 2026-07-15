'use client';

import Link from 'next/link';

type FormattedClientNumberProps = {
  clientId: number;
  showLink?: boolean;
};

export default function FormattedClientNumber({
  clientId,
  showLink = true,
}: FormattedClientNumberProps) {
  const padNumber = (num: number, length: number) => String(num).padStart(length, '0');

  return showLink ? (
    <Link
      href={`/dashboard/clients/${clientId}`}
      className="hover:text-blue-600 hover:underline font-mono"
      title="Przejdź do szczegółów klienta"
    >
      C{padNumber(clientId, 3)}
    </Link>
  ) : (
    <span className="font-mono">C{padNumber(clientId, 3)}</span>
  );
}
