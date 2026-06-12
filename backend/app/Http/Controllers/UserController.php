<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get paginated list of users
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
            'role' => 'string|in:admin,client,technician',
            'search' => 'string|max:255',
            'sort_by' => 'string|in:id,email,first_name,last_name,role,created_at',
            'sort_order' => 'string|in:asc,desc',
        ]);

        $page = $validated['page'] ?? 1;
        $perPage = $validated['per_page'] ?? 15;
        $role = $validated['role'] ?? null;
        $search = $validated['search'] ?? null;
        $sortBy = $validated['sort_by'] ?? 'created_at';
        $sortOrder = $validated['sort_order'] ?? 'desc';

        $query = User::query();

        if ($role) {
            $query->where('role', $role);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $total = $query->count();
        $users = $query
            ->orderBy($sortBy, $sortOrder)
            ->forPage($page, $perPage)
            ->get()
            ->map(fn($user) => $this->formatUser($user));

        return response()->json([
            'data' => $users,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => ceil($total / $perPage),
            ],
        ]);
    }

    /**
     * Get single user
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'data' => $this->formatUser($user),
        ]);
    }

    /**
     * Create new user
     */
    public function store(Request $request): JsonResponse
    {
        
        try {
            $validated = $request->validate([
                'email' => 'required|email|unique:users,email',
                'password' => 'required|min:8',
                'role' => 'required|in:admin,client,technician',
                'first_name' => 'required|string|max:100',
                'last_name' => 'required|string|max:100',
                'phone' => 'nullable|string|max:20',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }
    

        $user = User::create([
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'phone' => $validated['phone'] ?? null,
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'data' => $this->formatUser($user),
        ], 201);
    }

    /**
     * Update user
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['email', Rule::unique('users')->ignore($user->id)],
            'role' => 'in:admin,client,technician',
            'first_name' => 'string|max:100',
            'last_name' => 'string|max:100',
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|min:8',
        ]);

        $updateData = array_filter($validated, fn($value) => $value !== null);

        $user->update($updateData);

        return response()->json([
            'message' => 'User updated successfully',
            'data' => $this->formatUser($user),
        ]);
    }

    /**
     * Delete user (soft delete)
     */
    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }

    /**
     * Get all active technicians
     */
    public function technicians(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
        ]);

        $page = $validated['page'] ?? 1;
        $perPage = $validated['per_page'] ?? 50;

        $total = User::where('role', 'technician')->count();
        $technicians = User::where('role', 'technician')
            ->orderBy('created_at', 'desc')
            ->forPage($page, $perPage)
            ->get()
            ->map(fn($user) => $this->formatUser($user));

        return response()->json([
            'data' => $technicians,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => ceil($total / $perPage),
            ],
        ]);
    }

    /**
     * Get all active clients
     */
    public function clients(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
        ]);

        $page = $validated['page'] ?? 1;
        $perPage = $validated['per_page'] ?? 50;

        $total = User::where('role', 'client')->count();
        $clients = User::where('role', 'client')
            ->orderBy('created_at', 'desc')
            ->forPage($page, $perPage)
            ->get()
            ->map(fn($user) => $this->formatUser($user));

        return response()->json([
            'data' => $clients,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => ceil($total / $perPage),
            ],
        ]);
    }

    /**
     * Format user data for response
     */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'phone' => $user->phone,
            'email_verified_at' => $user->email_verified_at,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }
}
