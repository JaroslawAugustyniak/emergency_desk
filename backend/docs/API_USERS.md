# User Management API Documentation

## Authentication
All endpoints require authentication via Bearer token (Laravel Sanctum):
```
Authorization: Bearer {token}
```

## Authorization
All user management endpoints require **admin** role.

---

## Endpoints

### 1. Get Paginated List of Users
**GET** `/api/users`

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `per_page` | integer | 15 | Records per page (max: 100) |
| `role` | string | null | Filter by role: `admin`, `client`, `technician` |
| `search` | string | null | Search by email, first_name, last_name, or phone |
| `sort_by` | string | `created_at` | Sort field: `id`, `email`, `first_name`, `last_name`, `role`, `created_at` |
| `sort_order` | string | `desc` | Sort direction: `asc` or `desc` |

#### Response (200 OK)
```json
{
  "data": [
    {
      "id": 1,
      "email": "admin@example.com",
      "role": "admin",
      "first_name": "Admin",
      "last_name": "User",
      "phone": "+48123456789",
      "email_verified_at": "2026-06-11T10:00:00.000000Z",
      "created_at": "2026-06-11T10:00:00.000000Z",
      "updated_at": "2026-06-11T10:00:00.000000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 15,
    "total": 25,
    "last_page": 2
  }
}
```

#### Example Requests
```bash
# Get first page with 20 items per page
curl -X GET "http://localhost:8000/api/users?page=1&per_page=20" \
  -H "Authorization: Bearer {token}"

# Filter by role and search
curl -X GET "http://localhost:8000/api/users?role=technician&search=john&sort_by=first_name&sort_order=asc" \
  -H "Authorization: Bearer {token}"
```

---

### 2. Get Single User
**GET** `/api/users/{id}`

#### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | User ID |

#### Response (200 OK)
```json
{
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "role": "admin",
    "first_name": "Admin",
    "last_name": "User",
    "phone": "+48123456789",
    "email_verified_at": "2026-06-11T10:00:00.000000Z",
    "created_at": "2026-06-11T10:00:00.000000Z",
    "updated_at": "2026-06-11T10:00:00.000000Z"
  }
}
```

#### Example Request
```bash
curl -X GET "http://localhost:8000/api/users/1" \
  -H "Authorization: Bearer {token}"
```

---

### 3. Create User
**POST** `/api/users`

#### Request Body
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123",
  "role": "technician",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+48123456789"
}
```

#### Validation Rules
| Field | Rules |
|-------|-------|
| `email` | required, email, unique in users table |
| `password` | required, min 8 characters |
| `role` | required, must be: `admin`, `client`, or `technician` |
| `first_name` | required, max 100 characters |
| `last_name` | required, max 100 characters |
| `phone` | optional, max 20 characters |

#### Response (201 Created)
```json
{
  "message": "User created successfully",
  "data": {
    "id": 10,
    "email": "newuser@example.com",
    "role": "technician",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+48123456789",
    "email_verified_at": null,
    "created_at": "2026-06-11T12:30:00.000000Z",
    "updated_at": "2026-06-11T12:30:00.000000Z"
  }
}
```

#### Error Responses
```json
// 422 Unprocessable Entity - Validation failed
{
  "message": "The email has already been taken. (and 2 more errors)",
  "errors": {
    "email": ["The email has already been taken."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

#### Example Request
```bash
curl -X POST "http://localhost:8000/api/users" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePassword123",
    "role": "technician",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+48123456789"
  }'
```

---

### 4. Update User
**PUT** `/api/users/{id}`

#### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | User ID |

#### Request Body (all fields optional)
```json
{
  "email": "updated@example.com",
  "role": "client",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+48987654321",
  "password": "NewPassword123"
}
```

#### Validation Rules
| Field | Rules |
|-------|-------|
| `email` | email, unique (except current user) |
| `password` | min 8 characters |
| `role` | must be: `admin`, `client`, or `technician` |
| `first_name` | max 100 characters |
| `last_name` | max 100 characters |
| `phone` | optional, max 20 characters |

#### Response (200 OK)
```json
{
  "message": "User updated successfully",
  "data": {
    "id": 10,
    "email": "updated@example.com",
    "role": "client",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+48987654321",
    "email_verified_at": null,
    "created_at": "2026-06-11T12:30:00.000000Z",
    "updated_at": "2026-06-11T12:35:00.000000Z"
  }
}
```

#### Example Request
```bash
curl -X PUT "http://localhost:8000/api/users/10" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+48987654321"
  }'
```

---

### 5. Delete User
**DELETE** `/api/users/{id}`

#### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | User ID |

#### Note
User deletion uses soft deletes. The user record is marked as deleted but not removed from database.

#### Response (200 OK)
```json
{
  "message": "User deleted successfully"
}
```

#### Example Request
```bash
curl -X DELETE "http://localhost:8000/api/users/10" \
  -H "Authorization: Bearer {token}"
```

---

### 6. Get Technicians (Paginated)
**GET** `/api/users/technicians`

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `per_page` | integer | 50 | Records per page (max: 100) |

#### Response (200 OK)
```json
{
  "data": [
    {
      "id": 3,
      "email": "technician@example.com",
      "role": "technician",
      "first_name": "Jane",
      "last_name": "Smith",
      "phone": "+48345678901",
      "email_verified_at": "2026-06-11T10:00:00.000000Z",
      "created_at": "2026-06-11T10:00:00.000000Z",
      "updated_at": "2026-06-11T10:00:00.000000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 10,
    "last_page": 1
  }
}
```

#### Example Request
```bash
curl -X GET "http://localhost:8000/api/users/technicians?page=1&per_page=25" \
  -H "Authorization: Bearer {token}"
```

---

### 7. Get Clients (Paginated)
**GET** `/api/users/clients`

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `per_page` | integer | 50 | Records per page (max: 100) |

#### Response (200 OK)
```json
{
  "data": [
    {
      "id": 2,
      "email": "client@example.com",
      "role": "client",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+48234567890",
      "email_verified_at": "2026-06-11T10:00:00.000000Z",
      "created_at": "2026-06-11T10:00:00.000000Z",
      "updated_at": "2026-06-11T10:00:00.000000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 5,
    "last_page": 1
  }
}
```

#### Example Request
```bash
curl -X GET "http://localhost:8000/api/users/clients" \
  -H "Authorization: Bearer {token}"
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

### 403 Forbidden (Not Admin)
```json
{
  "message": "Unauthorized. Admin access required."
}
```

### 404 Not Found
```json
{
  "message": "Not found"
}
```

### 422 Unprocessable Entity
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field_name": ["Error message"]
  }
}
```

---

## Testing with cURL

### 1. Login first to get token
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@emergencydesk.ai",
    "password": "Password123"
  }'
```

### 2. Use returned token in subsequent requests
The response will contain a token like:
```json
{
  "access_token": "your_token_here",
  "token_type": "Bearer"
}
```

### 3. Use token in Authorization header
```bash
TOKEN="your_token_here"
curl -X GET "http://localhost:8000/api/users?page=1&per_page=10" \
  -H "Authorization: Bearer $TOKEN"
```
