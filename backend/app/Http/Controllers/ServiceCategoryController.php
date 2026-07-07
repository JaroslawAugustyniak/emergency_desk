<?php

namespace App\Http\Controllers;

use App\Models\ServiceCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ServiceCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'client_id' => 'required|integer|exists:clients,id',
                'page' => 'integer|min:1',
                'per_page' => 'integer|min:1|max:100',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        }
        //tu damy coś żeby się deployment uruchomił. 
        $page = $validated['page'] ?? 1;
        $perPage = $validated['per_page'] ?? 50;
        $clientId = $validated['client_id'];

        $paginated = ServiceCategory::where('client_id', $clientId)
            ->orderBy('name', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);

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

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'client_id' => 'required|integer|exists:clients,id',
                'name' => 'required|string|max:100',
                'color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        }

        $category = ServiceCategory::create($validated);

        return response()->json([
            'message' => 'Service category created successfully',
            'data' => $category,
        ], 201);
    }

    public function show(Request $request, $categoryId): JsonResponse
    {
        $category = ServiceCategory::find($categoryId);

        if (!$category) {
            return response()->json([
                'error' => 'Resource not found',
            ], 404);
        }

        return response()->json([
            'data' => $category,
        ]);
    }

    public function update(Request $request, $categoryId): JsonResponse
    {
        \Log::info('ServiceCategoryController@update', [
            'categoryId' => $categoryId,
            'requestData' => $request->all(),
        ]);

        $category = ServiceCategory::find($categoryId);

        if (!$category) {
            \Log::warning('ServiceCategory not found', ['categoryId' => $categoryId]);
            return response()->json([
                'error' => 'Resource not found',
            ], 404);
        }

        $validated = [];

        if ($request->has('name')) {
            $request->validate(['name' => 'required|string|max:100']);
            $validated['name'] = $request->input('name');
        }

        if ($request->has('color')) {
            $request->validate(['color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/']);
            $validated['color'] = $request->input('color');
        }

        \Log::info('Validated data to update:', ['validated' => $validated]);

        if (empty($validated)) {
            return response()->json([
                'message' => 'No fields to update',
                'data' => $category,
            ]);
        }

        $category->update($validated);
        \Log::info('Category updated successfully', ['category' => $category->toArray()]);

        return response()->json([
            'message' => 'Service category updated successfully',
            'data' => $category,
        ]);
    }

    public function destroy(Request $request, $categoryId): JsonResponse
    {
        $category = ServiceCategory::find($categoryId);

        if (!$category) {
            return response()->json([
                'error' => 'Resource not found',
            ], 404);
        }

        $category->delete();

        return response()->json([
            'message' => 'Service category deleted successfully',
        ]);
    }
}
