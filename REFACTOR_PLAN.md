# Plan refaktoryzacji - Centralizacja typów i API

## Cel
Scentralizować typy danych i logikę pobierania danych aby uniknąć duplikacji kodu i ułatwić utrzymanie.

---

## 1. Struktura katalogów - PROPONOWANA

```
frontend/src/
├── lib/
│   ├── types/                          # NOWY - centralne typy
│   │   ├── index.ts                    # re-exports wszystkich typów
│   │   ├── locations.ts                # Location, CreateLocationData, UpdateLocationData
│   │   ├── clients.ts                  # Client, CreateClientData, UpdateClientData
│   │   ├── users.ts                    # User, CreateUserData, UpdateUserData
│   │   └── common.ts                   # Gemeinsame interfejsy (pagination, etc)
│   │
│   ├── api/                            # NOWY/EXPANDED - API client
│   │   ├── apiClient.ts                # (już istnieje) - base client
│   │   ├── endpoints.ts                # NOWY - URLe endpoints jako stałe
│   │   └── services/                   # NOWY - typed API services
│   │       ├── locationService.ts      # getLocation, getLocations, createLocation, updateLocation, deleteLocation
│   │       ├── clientService.ts        # getClient, getClients, createClient, updateClient, deleteClient
│   │       ├── userService.ts          # getUser, getUsers, createUser, updateUser, deleteUser
│   │       └── index.ts                # re-exports wszystkich services
│   │
│   └── actions/                        # (już istnieje)
│       └── będą używać services
│
└── app/
    ├── components/
    │   ├── locations/
    │   │   ├── LocationFormModal.tsx    # będzie importować z lib/types i lib/api/services
    │   │   └── LocationsTable.tsx       # będzie importować z lib/types i lib/api/services
    │   │
    │   └── clients/
    │       └── (analogicznie)
    │
    └── hooks/                          # OPCJONALNIE - custom hooks
        ├── useLocation.ts
        ├── useLocations.ts
        └── (itd)
```

---

## 2. Pliki do stworzenia

### 2.1 `lib/types/locations.ts`
```typescript
// Scentralizuj wszystkie Location-related typy
export type Location = {
  id: number;
  name: string;
  address: string;
  number: string;
  zip: string;
  city: string;
  country: string;
  nip?: string;
  client_id: number;
  user_id?: number | null;
  created_at: string;
  updated_at: string;
};

export type CreateLocationData = {
  name: string;
  address: string;
  number: string;
  zip: string;
  city: string;
  country?: string;
  nip?: string;
  client_id: number;
  user_id?: number | null;
};

export type UpdateLocationData = Partial<Omit<CreateLocationData, 'client_id'>>;

export type LocationFilters = {
  page?: number;
  per_page?: number;
  search?: string;
  client_id?: number;
  sort_by?: 'id' | 'name' | 'address' | 'city' | 'created_at';
  sort_order?: 'asc' | 'desc';
};
```

### 2.2 `lib/types/common.ts`
```typescript
// Gemeinsame interfejsy
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type ApiResponse<T> = {
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
};
```

### 2.3 `lib/types/index.ts`
```typescript
// Re-export wszystkich typów - single import point
export * from './locations';
export * from './clients';
export * from './users';
export * from './common';
```

### 2.4 `lib/api/endpoints.ts`
```typescript
// Stałe endpoints - jedna źródło prawdy
export const ENDPOINTS = {
  locations: {
    index: '/locations',
    show: (id: number) => `/locations/${id}`,
    create: '/locations',
    update: (id: number) => `/locations/${id}`,
    delete: (id: number) => `/locations/${id}`,
  },
  clients: {
    index: '/clients',
    show: (id: number) => `/clients/${id}`,
    // itd
  },
  users: {
    index: '/users',
    show: (id: number) => `/users/${id}`,
    // itd
  },
};
```

### 2.5 `lib/api/services/locationService.ts`
```typescript
import { apiClient } from '@/lib/api/apiClient';
import { Location, CreateLocationData, UpdateLocationData, LocationFilters } from '@/lib/types';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { PaginatedResponse } from '@/lib/types';

class LocationService {
  async getLocations(filters?: LocationFilters, token?: string): Promise<PaginatedResponse<Location>> {
    if (token) apiClient.setToken(token);
    
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.per_page) params.append('per_page', String(filters.per_page));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.client_id) params.append('client_id', String(filters.client_id));
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);

    return apiClient.get(`${ENDPOINTS.locations.index}?${params.toString()}`);
  }

  async getLocation(id: number, token?: string): Promise<{ data: Location }> {
    if (token) apiClient.setToken(token);
    return apiClient.get(ENDPOINTS.locations.show(id));
  }

  async createLocation(data: CreateLocationData, token: string): Promise<{ data: Location }> {
    apiClient.setToken(token);
    return apiClient.post(ENDPOINTS.locations.create, data);
  }

  async updateLocation(id: number, data: UpdateLocationData, token: string): Promise<{ data: Location }> {
    apiClient.setToken(token);
    return apiClient.put(ENDPOINTS.locations.update(id), data);
  }

  async deleteLocation(id: number, token: string): Promise<void> {
    apiClient.setToken(token);
    return apiClient.delete(ENDPOINTS.locations.delete(id));
  }
}

export const locationService = new LocationService();
```

### 2.6 `lib/api/services/index.ts`
```typescript
// Re-export wszystkich services
export { locationService } from './locationService';
export { clientService } from './clientService';
export { userService } from './userService';
```

---

## 3. Zmiany w istniejących plikach

### 3.1 `lib/actions/locations.ts` - REFACTOR
```typescript
// Teraz będzie wrapper/facade, może być uproszczony
import { locationService } from '@/lib/api/services';
import { Location, CreateLocationData, UpdateLocationData } from '@/lib/types';

export async function createLocation(data: CreateLocationData, token: string): Promise<Location> {
  const response = await locationService.createLocation(data, token);
  return response.data;
}

export async function updateLocation(id: number, data: UpdateLocationData, token: string): Promise<Location> {
  const response = await locationService.updateLocation(id, data, token);
  return response.data;
}

export async function deleteLocation(id: number, token: string): Promise<void> {
  return locationService.deleteLocation(id, token);
}
```

### 3.2 Komponenty - REFACTOR
```typescript
// LocationFormModal.tsx
import { Location, UpdateLocationData } from '@/lib/types';
import { locationService } from '@/lib/api/services';

// zamiast:
// import { createLocation, updateLocation } from '@/lib/actions/locations';
// import Location type z lokalnie
```

### 3.3 Tabele - REFACTOR
```typescript
// LocationsTable.tsx
import { Location, LocationFilters } from '@/lib/types';
import { locationService } from '@/lib/api/services';

const handleFetchLocations = async (filters: LocationFilters) => {
  const response = await locationService.getLocations(filters, token);
  setLocations(response.data);
};
```

---

## 4. Korzyści tej refaktoryzacji

✅ **Jedno źródło prawdy dla typów** - zmiana struktury API = zmiana w jednym miejscu
✅ **Brak duplikacji kodu** - logika fetch'a w jednym service'u
✅ **Łatwiejsze testowanie** - mockami service'ów zamiast fetch'a
✅ **Lepsze type-safety** - typy zawsze zsynchronizowane
✅ **Łatwiejsze scalowanie** - inny dev wie gdzie szukać kodu
✅ **Możliwość cache'owania** - service może cache'ować rezultaty
✅ **Obsługa errrorów w jednym miejscu** - każdy service ma spójną obsługę
✅ **Możliwość retry logic** - można dodać w base service'u

---

## 5. Fazy implementacji

### Faza 1: Locations (testowy pattern)
- [ ] Stwórz `lib/types/locations.ts`
- [ ] Stwórz `lib/types/common.ts` i `lib/types/index.ts`
- [ ] Stwórz `lib/api/endpoints.ts`
- [ ] Stwórz `lib/api/services/locationService.ts`
- [ ] Stwórz `lib/api/services/index.ts`
- [ ] Zaktualizuj `lib/actions/locations.ts`
- [ ] Zaktualizuj `LocationFormModal.tsx`
- [ ] Zaktualizuj `LocationsTable.tsx`
- [ ] Test: upewnij się że wszystko działa

### Faza 2: Clients (apply pattern)
- [ ] Stwórz `lib/types/clients.ts`
- [ ] Stwórz `lib/api/services/clientService.ts`
- [ ] Zaktualizuj komponenty klientów
- [ ] Test

### Faza 3: Users (apply pattern)
- [ ] Stwórz `lib/types/users.ts`
- [ ] Stwórz `lib/api/services/userService.ts`
- [ ] Zaktualizuj komponenty userów
- [ ] Test

### Faza 4: Opcjonalne ulepszenia
- [ ] Dodaj custom hooks (`useLocation`, `useLocations`)
- [ ] Dodaj retry logic w apiClient
- [ ] Dodaj cache'owanie w services
- [ ] Dodaj error handling middleware

---

## 6. Możliwe rozszerzenia (future)

```typescript
// Custom hook przykład
export function useLocations(filters?: LocationFilters) {
  const [data, setData] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        const response = await locationService.getLocations(filters, token);
        setData(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [filters]);

  return { data, isLoading, error };
}
```

---

## Notatki

- Wszystkie path'y przyjmują że jesteśmy w `/home/jarek/projects/emergency_desk/`
- Pattern jest uniwersalny - można go zastosować do wszystkich zasobów (clients, users, etc)
- Można to robić incrementalnie - nie trzeba robić wszystko naraz
- Warto zacząć od locations jako test pattern'u
