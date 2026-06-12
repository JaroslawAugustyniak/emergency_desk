'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SessionContextType {
  token: string | null;
  isLoading: boolean;
  setToken: (token: string | null) => void;
}

const SessionContext = createContext<SessionContextType>({
  token: null,
  isLoading: true,
  setToken: () => {},
});

export function useSessionContext() {
  return useContext(SessionContext);
}

export default function SessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('access_token', newToken);
    } else {
      localStorage.removeItem('access_token');
    }
  };

  useEffect(() => {
    // Get token from localStorage on mount
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setTokenState(storedToken);
    }
    setIsLoading(false);
  }, []);

  return (
    <SessionContext.Provider value={{ token, isLoading, setToken }}>
      {children}
    </SessionContext.Provider>
  );
}