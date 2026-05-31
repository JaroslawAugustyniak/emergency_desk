'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SessionContextType {
  token: string | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType>({
  token: null,
  isLoading: true,
});

export function useSessionContext() {
  return useContext(SessionContext);
}

export default function SessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('access_token');
    setToken(storedToken);
    setIsLoading(false);
  }, []);

  return (
    <SessionContext.Provider value={{ token, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}