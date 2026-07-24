'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SessionContextType {
  token: string | null;
  role: 'admin' | 'client' | 'technician' | null;
  isLoading: boolean;
  setToken: (token: string | null, rememberMe?: boolean) => void;
  setRole: (role: 'admin' | 'client' | 'technician' | null) => void;
}

const SessionContext = createContext<SessionContextType>({
  token: null,
  role: null,
  isLoading: true,
  setToken: () => {},
  setRole: () => {},
});

export function useSessionContext() {
  return useContext(SessionContext);
}

function getTokenFromCookie(name: string = 'access_token'): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + '=';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length);
    }
  }
  return null;
}

export default function SessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [token, setTokenState] = useState<string | null>(null);
  const [role, setRoleState] = useState<'admin' | 'client' | 'technician' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setToken = (newToken: string | null, rememberMe: boolean = false) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('access_token', newToken);

      // Set cookie if remember me is checked
      if (rememberMe) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30); // 30 days
        document.cookie = `access_token=${newToken}; expires=${expirationDate.toUTCString()}; path=/`;
      }
    } else {
      localStorage.removeItem('access_token');
      // Clear cookie
      document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  };

  const setRole = (newRole: 'admin' | 'client' | 'technician' | null) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem('user_role', newRole);
    } else {
      localStorage.removeItem('user_role');
    }
  };

  useEffect(() => {
    // Try to get token from localStorage first (session login)
    let storedToken = localStorage.getItem('access_token');

    // If not in localStorage, try to get from cookie (remember me)
    if (!storedToken) {
      storedToken = getTokenFromCookie('access_token');
    }

    if (storedToken) {
      setTokenState(storedToken);
    }

    // Get stored role
    const storedRole = localStorage.getItem('user_role') as 'admin' | 'client' | 'technician' | null;
    if (storedRole) {
      setRoleState(storedRole);
    }

    setIsLoading(false);
  }, []);

  return (
    <SessionContext.Provider value={{ token, role, isLoading, setToken, setRole }}>
      {children}
    </SessionContext.Provider>
  );
}