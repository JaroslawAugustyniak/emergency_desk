'use client';

import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

type PortalProps = {
  children: ReactNode;
};

export default function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
