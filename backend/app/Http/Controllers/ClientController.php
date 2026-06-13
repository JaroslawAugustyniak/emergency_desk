<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class ClientController extends Controller
{
    /**
     * Get paginated list of clients
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
            'search' => 'string|max:255',
            'sort_by' => 'string|in:id,name,created_at',
            'sort_order' => 'string|in:asc,desc',
        ]);

        $page = $validated['page'] ?? 1;
        $perPage = $validated['per_page'] ?? 15;
        $search = $validated['search'] ?? null;
        $sortBy = $validated['sort_by'] ?? 'created_at';
        $sortOrder = $validated['sort_order'] ?? 'desc';

        $query = Client::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('hash', 'like', "%{$search}%");
            });
        }

        $total = $query->count();
        $clients = $query
            ->orderBy($sortBy, $sortOrder)
            ->forPage($page, $perPage)
            ->get()
            ->map(fn($client) => $this->formatClient($client));

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
     * Get single client
     */
    public function show(Client $client): JsonResponse
    {
        return response()->json([
            'data' => $this->formatClient($client),
        ]);
    }

    /**
     * Create new client
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }

        $client = Client::create([
            'name' => $validated['name'],
            'hash' => Client::generateHash(),
        ]);

        return response()->json([
            'message' => 'Client created successfully',
            'data' => $this->formatClient($client),
        ], 201);
    }

    /**
     * Update client
     */
    public function update(Request $request, Client $client): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
        ]);

        $updateData = array_filter($validated, fn($value) => $value !== null);

        $client->update($updateData);

        return response()->json([
            'message' => 'Client updated successfully',
            'data' => $this->formatClient($client),
        ]);
    }

    /**
     * Delete client (soft delete)
     */
    public function destroy(Client $client): JsonResponse
    {
        $client->delete();

        return response()->json([
            'message' => 'Client deleted successfully',
        ]);
    }

    /**
     * Regenerate client hash
     */
    public function regenerateHash(Client $client): JsonResponse
    {
        $client->regenerateHash();

        return response()->json([
            'message' => 'Hash regenerated successfully',
            'data' => $this->formatClient($client),
        ]);
    }

    /**
     * Format client data for response
     */
    private function formatClient(Client $client): array
    {
        return [
            'id' => $client->id,
            'name' => $client->name,
            'hash' => $client->hash,
            'created_at' => $client->created_at,
            'updated_at' => $client->updated_at,
        ];
    }
}
