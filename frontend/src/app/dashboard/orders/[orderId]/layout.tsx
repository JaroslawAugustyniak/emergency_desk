'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSetPageTitle } from '@/hooks/useSetPageTitle';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { getOrder } from '@/lib/actions/orders';
import { formatOrderNumber } from '@/lib/functions/formatting';

export default function OrderDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const [orderNumber, setOrderNumber] = useState<string>('');
  const { token } = useSessionContext();

  useEffect(() => {
    if (!token || !orderId) return;

    const fetchOrder = async () => {
      try {
        const data = await getOrder(Number(orderId), token);
        const order = data.data;

        
        
        


        setOrderNumber(formatOrderNumber(order.client_id, order.location_id, order.id));
      } catch (error) {
        console.error('Error fetching order:', error);
      }
    };

    fetchOrder();
  }, [token, orderId]);

  useSetPageTitle(
    orderNumber ? `${orderNumber}` : ''
  );

  return <>{children}</>;
}
