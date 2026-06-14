<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LocationController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
            'search' => 'string|max:255',
            'client_id' => 'integer|exists:clients,id',
            'sort_by' => 'in:id,name,address,city,created_at',
            'sort_order' => 'in:asc,desc',
        ]);

        $page = $validated['page'] ?? 1;
        $perPage = $validated['per_page'] ?? 15;
        $search = $validated['search'] ?? '';
        $clientId = $validated['client_id'] ?? null;
        $sortBy = $validated['sort_by'] ?? 'name';
        $sortOrder = $validated['sort_order'] ?? 'asc';

        $query = Location::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhere('zip', 'like', "%{$search}%")
                    ->orWhere('number', 'like', "%{$search}%");
            });
        }

        if ($clientId) {
            $query->where('client_id', $clientId);
        }

        $query->orderBy($sortBy, $sortOrder);

        $paginated = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $paginated->items(),
            'pagination' => [
                'page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'number' => 'required|string|max:50',
            'zip' => 'required|string|max:20',
            'city' => 'required|string|max:100',
            'country' => 'nullable|string|max:2',
            'client_id' => 'required|integer|exists:clients,id',
        ]);

        $location = Location::create($validated);

        return response()->json([
            'data' => $location,
        ], 201);
    }

    public function show(Location $location)
    {
        return response()->json([
            'data' => $location,
        ]);
    }

    public function update(Request $request, Location $location)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string|max:255',
            'number' => 'sometimes|required|string|max:50',
            'zip' => 'sometimes|required|string|max:20',
            'city' => 'sometimes|required|string|max:100',
            'country' => 'nullable|string|max:2',
        ]);

        $location->update($validated);

        return response()->json([
            'data' => $location,
        ]);
    }

    public function destroy(Location $location)
    {
        $location->delete();

        return response()->json(null, 204);
    }
}
