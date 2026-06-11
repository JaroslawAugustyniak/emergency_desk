# User Management Implementation - Setup Guide

## Overview
User management module for Emergency Desk SaaS application. This includes database schema, API endpoints, and authentication/authorization controls.

## What Was Implemented

### 1. Database Changes
- **Migration**: `2026_06_11_000000_modify_users_table_for_roles.php`
  - Added `role` enum field (admin, client, technician)
  - Added `first_name` varchar(255)
  - Added `last_name` varchar(255)
  - Added `phone` varchar(20)
  - Added `deleted_at` timestamp (soft deletes)

### 2. Model Updates
- **User Model** (`app/Models/User.php`)
  - Added `SoftDeletes` trait
  - Updated `$fillable` array with new fields
  - Removed old `name` field usage (migrated to first_name + last_name)

### 3. API Endpoints
All endpoints require authentication (Bearer token) and admin role.

#### User Management Endpoints
```
GET    /api/users                      - List users (paginated)
POST   /api/users                      - Create new user
GET    /api/users/{id}                 - Get single user
PUT    /api/users/{id}                 - Update user
DELETE /api/users/{id}                 - Delete user (soft delete)
GET    /api/users/technicians          - List technicians (paginated)
GET    /api/users/clients              - List clients (paginated)
```

### 4. Authorization
- **Middleware**: `IsAdmin` middleware (`app/Http/Middleware/IsAdmin.php`)
  - Registered in Kernel as `admin` alias
  - Checks if user role is 'admin'
  - Returns 403 Forbidden if not admin

### 5. API Documentation
- Complete API documentation: `backend/docs/API_USERS.md`
- Includes request/response examples
- Query parameter descriptions
- Error response formats
- cURL examples for testing

### 6. Database Seeders
- **UserSeeder** (`database/seeders/UserSeeder.php`)
  - Creates 1 admin user
  - Creates 1 sample client
  - Creates 1 sample technician
  - Creates 5 additional test technicians
  - Creates 3 additional test clients

## Setup Instructions

### 1. Run Database Migrations
```bash
cd backend
php artisan migrate
```

### 2. Seed the Database
```bash
php artisan db:seed --class=UserSeeder
```

Or seed all (if other seeders exist):
```bash
php artisan db:seed
```

### 3. Verify Migration
Check that users table has been modified:
```bash
php artisan tinker
# In tinker shell:
>>> DB::table('users')->getConnection()->getSchemaBuilder()->getColumnListing('users')
```

Should show columns: id, name, email, email_verified_at, password, remember_token, verification_code, verification_code_expires, reset_password_token, reset_password_expires, **role, first_name, last_name, phone, deleted_at**, created_at, updated_at

## Testing the API

### 1. Start the Application
```bash
# From project root
docker-compose up -d

# Or rebuild if changes made to Dockerfile
docker-compose up -d --build
```

### 2. Access the API
- Backend API: `http://localhost:8000`
- Test endpoint: `http://localhost:8000/api/test`

### 3. Login to Get Token
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@emergencydesk.ai",
    "password": "Password123"
  }'
```

Save the returned `access_token`.

### 4. Test User Endpoints
```bash
TOKEN="your_access_token"

# Get users list (page 1, 10 per page)
curl -X GET "http://localhost:8000/api/users?page=1&per_page=10" \
  -H "Authorization: Bearer $TOKEN"

# Create new user
curl -X POST "http://localhost:8000/api/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newtech@example.com",
    "password": "SecurePass123",
    "role": "technician",
    "first_name": "Mark",
    "last_name": "Johnson",
    "phone": "+48500600700"
  }'

# Get technicians only
curl -X GET "http://localhost:8000/api/users/technicians?per_page=5" \
  -H "Authorization: Bearer $TOKEN"

# Get clients only
curl -X GET "http://localhost:8000/api/users/clients" \
  -H "Authorization: Bearer $TOKEN"

# Update user
curl -X PUT "http://localhost:8000/api/users/2" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "phone": "+48999999999"
  }'

# Delete user
curl -X DELETE "http://localhost:8000/api/users/2" \
  -H "Authorization: Bearer $TOKEN"
```

## Default Test Users

After seeding, the following users will be created:

| Email | Password | Role | First Name | Last Name | Phone |
|-------|----------|------|-----------|----------|-------|
| admin@emergencydesk.ai | Password123 | admin | Admin | User | +48123456789 |
| client@example.com | password123 | client | John | Doe | +48234567890 |
| technician@example.com | password123 | technician | Jane | Smith | +48345678901 |
| technician1@example.com | password123 | technician | Tech | Person1 | +48*random* |
| technician2@example.com | password123 | technician | Tech | Person2 | +48*random* |
| client1@example.com | password123 | client | Client | Company1 | +48*random* |
| client2@example.com | password123 | client | Client | Company2 | +48*random* |

## Pagination Guide

The API supports standard pagination with the following parameters:

### Parameters
- `page` (integer, default: 1) - Page number, starts from 1
- `per_page` (integer, default: 15) - Records per page
  - Min: 1
  - Max: 100
  - Adjusted per endpoint (users: 15, technicians/clients: 50)

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 15,
    "total": 50,
    "last_page": 4
  }
}
```

### Examples
```bash
# Get second page with 20 items
curl "http://localhost:8000/api/users?page=2&per_page=20" \
  -H "Authorization: Bearer $TOKEN"

# Get all technicians on one page (100 per page)
curl "http://localhost:8000/api/users/technicians?per_page=100" \
  -H "Authorization: Bearer $TOKEN"
```

## Search & Filter Examples

### Search by Email, Name, or Phone
```bash
curl "http://localhost:8000/api/users?search=john" \
  -H "Authorization: Bearer $TOKEN"
```

### Filter by Role
```bash
curl "http://localhost:8000/api/users?role=technician" \
  -H "Authorization: Bearer $TOKEN"
```

### Sort by Different Fields
```bash
# Sort by first name ascending
curl "http://localhost:8000/api/users?sort_by=first_name&sort_order=asc" \
  -H "Authorization: Bearer $TOKEN"

# Sort by email descending (default)
curl "http://localhost:8000/api/users?sort_by=email&sort_order=desc" \
  -H "Authorization: Bearer $TOKEN"
```

### Combined Filters
```bash
curl "http://localhost:8000/api/users?role=technician&search=jane&sort_by=last_name&sort_order=asc&page=1&per_page=25" \
  -H "Authorization: Bearer $TOKEN"
```

## Files Modified/Created

### Created Files
- `backend/database/migrations/2026_06_11_000000_modify_users_table_for_roles.php`
- `backend/app/Http/Controllers/UserController.php`
- `backend/app/Http/Middleware/IsAdmin.php`
- `backend/docs/API_USERS.md`
- `USER_MANAGEMENT_SETUP.md` (this file)

### Modified Files
- `backend/app/Models/User.php` - Added SoftDeletes, updated fillable
- `backend/routes/api.php` - Added user routes
- `backend/app/Http/Kernel.php` - Registered admin middleware
- `backend/database/seeders/UserSeeder.php` - Updated with new fields

## Next Steps

### Phase 2 Features to Implement
1. **Client Management**
   - Models for clients table
   - API endpoints for client-specific settings
   
2. **Service Categories**
   - Manage service categories per client
   - Color coding for categories

3. **Address Management**
   - Manage predefined addresses per client
   - Autocomplete for address selection

4. **Frontend User Management Interface**
   - Admin dashboard for managing users
   - User creation form
   - User editing form
   - User list with pagination
   - Search and filter UI

## Troubleshooting

### Migration fails: "Table 'users' doesn't exist"
- Ensure previous migrations have been run
- Run: `php artisan migrate`

### Seeding fails: "Column 'role' doesn't exist"
- Run migrations first: `php artisan migrate`
- Then seed: `php artisan db:seed`

### Token invalid/expired
- Get new token by logging in again
- Tokens are stored in `personal_access_tokens` table

### Admin middleware returns 403
- Verify user role is 'admin' in database
- Check token corresponds to admin user

### Soft delete not working
- Ensure `SoftDeletes` trait is added to User model
- Soft deleted users are excluded from queries by default
- To include deleted users: `User::withTrashed()`
- To get only deleted users: `User::onlyTrashed()`

## References

- [API Documentation](backend/docs/API_USERS.md)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)
- [Laravel Soft Deletes](https://laravel.com/docs/eloquent#soft-deleting)
- [Laravel Validation](https://laravel.com/docs/validation)
