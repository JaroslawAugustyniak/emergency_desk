'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'client' | 'technician';
}

interface SessionContextType {
  token: string | null;
  role: 'admin' | 'client' | 'technician' | null;
  user: UserData | null;
  isLoading: boolean;
  setToken: (token: string | null, rememberMe?: boolean) => void;
  setRole: (role: 'admin' | 'client' | 'technician' | null) => void;
  setUser: (user: UserData | null) => void;
}

const SessionContext = createContext<SessionContextType>({
  token: null,
  role: null,
  user: null,
  isLoading: true,
  setToken: () => {},
  setRole: () => {},
  setUser: () => {},
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
  const [user, setUserState] = useState<UserData | null>(null);
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
      localStorage.removeItem('user_data');
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

  const setUser = (newUser: UserData | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('user_data', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user_data');
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

    // Get stored user data
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user_data');
      }
    }

    setIsLoading(false);
  }, []);

  return (
    <SessionContext.Provider value={{ token, role, user, isLoading, setToken, setRole, setUser }}>
      {children}
    </SessionContext.Provider>
  );
}