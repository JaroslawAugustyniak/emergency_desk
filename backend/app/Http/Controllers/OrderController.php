<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OrderController extends Controller
{
    /**
     * Get paginated list of orders (filtered by role)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'page' => 'integer|min:1',
                'per_page' => 'integer|min:1|max:100',
                'search' => 'string|max:255',
                'client_id' => 'integer',
                'location_id' => 'integer',
                'status' => 'string|in:new,assigned,in_progress,paused,completed,invoiced',
                'sort_by' => 'string|in:id,order_number,status,order_date,created_at',
                'sort_order' => 'string|in:asc,desc',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        }

        $user = $request->user();
        $page = $validated['page'] ?? 1;
        $perPage = $validated['per_page'] ?? 15;
        $search = $validated['search'] ?? null;
        $clientId = $validated['client_id'] ?? null;
        $locationId = $validated['location_id'] ?? null;
        $status = $validated['status'] ?? null;
        $sortBy = $validated['sort_by'] ?? 'created_at';
        $sortOrder = $validated['sort_order'] ?? 'desc';

        $query = Order::query()
            ->with(['client', 'technician', 'location', 'serviceCategory', 'photos']);

        // Filter by role
        if ($user->role === 'client') {
            $client = $user->client;
            if (!$client) {
                return response()->json(['message' => 'Client profile not found'], 404);
            }
            $query->where('client_id', $client->id);
        } elseif ($user->role === 'technician') {
            $query->where('technician_id', $user->id);
        }
        // Admin sees all orders

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('client_ref_no', 'like', "%{$search}%");
            });
        }

        if ($clientId && $user->role === 'admin') {
            $query->where('client_id', $clientId);
        }

        if ($locationId) {
            $query->where('location_id', $locationId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $total = $query->count();
        $orders = $query
            ->orderBy($sortBy, $sortOrder)
            ->forPage($page, $perPage)
            ->get()
            ->map(fn($order) => $this->formatOrder($order, $request));

        return response()->json([
            'data' => $orders,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => ceil($total / $perPage),
            ],
        ]);
    }

    /**
     * Get single order (check access by role)
     */
    public function show(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Check access based on role
        if ($user->role === 'client') {
            $client = $user->client;
            if (!$client || $order->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($user->role === 'technician') {
            if ($order->technician_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }
        // Admin can view all

        $order->load(['client', 'technician', 'location', 'serviceCategory', 'photos']);
        return response()->json([
            'data' => $this->formatOrder($order, $request),
        ]);
    }

    /**
     * Create new order (client creates for own ID, admin creates for any client)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            $validated = $request->validate([
                'client_id' => 'required|integer|exists:clients,id',
                'location_id' => 'required|integer|exists:locations,id',
                'service_category_id' => 'required|integer|exists:service_categories,id',
                'description' => 'nullable|string',
                'is_emergency' => 'nullable|boolean',
                'client_ref_no' => 'nullable|string|max:100',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        }

        // Client can only create for their own client_id
        if ($user->role === 'client') {
            $client = $user->client;
            if (!$client || $validated['client_id'] !== $client->id) {
                return response()->json(['message' => 'You can only create orders for your own client'], 403);
            }
        }

        $order = Order::create([
            'client_id' => $validated['client_id'],
            'location_id' => $validated['location_id'],
            'service_category_id' => $validated['service_category_id'],
            'description' => $validated['description'] ?? null,
            'is_emergency' => $validated['is_emergency'] ?? false,
            'client_ref_no' => $validated['client_ref_no'] ?? null,
            'status' => 'new',
            'order_date' => now(),
        ]);

        $order->load(['client', 'technician', 'location', 'serviceCategory', 'photos']);

        return response()->json([
            'message' => 'Order created successfully',
            'data' => $this->formatOrder($order, $request),
        ], 201);
    }

    /**
     * Update order (role-based field restrictions)
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Check access
        if ($user->role === 'client') {
            $client = $user->client;
            if (!$client || $order->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($user->role === 'technician') {
            if ($order->technician_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        try {
            $validated = $request->validate([
                'description' => 'string',
                'client_ref_no' => 'nullable|string|max:100',
                'work_report' => 'nullable|string',
                'vat_rate' => 'numeric|min:0|max:100',
                'is_emergency' => 'boolean',
                'price_total' => 'nullable|numeric|min:0',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        }

        $updateData = array_filter($validated, fn($value) => $value !== null);

        // Restrict fields by role
        if ($user->role === 'client') {
            $updateData = array_intersect_key($updateData, array_flip(['description', 'client_ref_no']));
        } elseif ($user->role === 'technician') {
            $updateData = array_intersect_key($updateData, array_flip(['work_report']));
        }
        // Admin can update all fields

        $order->update($updateData);
        $order->load(['client', 'technician', 'location', 'serviceCategory', 'photos']);

        return response()->json([
            'message' => 'Order updated successfully',
            'data' => $this->formatOrder($order, $request),
        ]);
    }

    /**
     * Delete order (soft delete)
     */
    public function destroy(Order $order): JsonResponse
    {
        $order->delete();

        return response()->json([
            'message' => 'Order deleted successfully',
        ]);
    }

    /**
     * Change order status (role-based restrictions)
     */
    public function changeStatus(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Technician can only change status of assigned orders
        if ($user->role === 'technician') {
            if ($order->technician_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            // Technician can only use these statuses
            $allowedStatuses = ['in_progress', 'paused', 'completed'];
        } elseif ($user->role === 'client') {
            return response()->json(['message' => 'Clients cannot change order status'], 403);
        } else {
            // Admin can use all statuses
            $allowedStatuses = ['new', 'assigned', 'in_progress', 'paused', 'completed', 'invoiced'];
        }

        try {
            $validated = $request->validate([
                'status' => 'required|string|in:' . implode(',', $allowedStatuses),
                'stop_reason' => 'nullable|string',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        }

        $status = $validated['status'];

        // Handle status transitions for technician
        if ($user->role === 'technician') {
            if ($status === 'in_progress' && !in_array($order->status, ['assigned', 'paused', 'completed'])) {
                return response()->json(['message' => 'Invalid status transition'], 422);
            }
            if ($status === 'in_progress') {
                if (!$order->start_at) {
                    $order->start_at = now();
                }
                $order->end_at = null;
            }
            if ($status === 'paused') {
                $order->stop_reason = $validated['stop_reason'] ?? null;
                $order->start_at = $order->start_at ?? now();
            }
            if ($status === 'completed') {
                if (!$order->start_at) {
                    $order->start_at = now();
                }
                $order->end_at = now();
            }
        } else {
            // Admin
            if ($status === 'paused') {
                $order->stop_reason = $validated['stop_reason'] ?? null;
            }
        }

        $order->status = $status;
        $order->save();

        $order->load(['client', 'technician', 'location', 'serviceCategory', 'photos']);

        return response()->json([
            'message' => 'Order status changed successfully',
            'data' => $this->formatOrder($order, $request),
        ]);
    }

    /**
     * Assign technician to order
     */
    public function assignTechnician(Request $request, Order $order): JsonResponse
    {
        try {
            $validated = $request->validate([
                'technician_id' => 'required|integer|exists:users,id',
                'is_emergency' => 'nullable|boolean',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        }

        $order->technician_id = $validated['technician_id'];
        $order->status = 'assigned';
        if (isset($validated['is_emergency'])) {
            $order->is_emergency = $validated['is_emergency'];
        }
        $order->save();

        $order->load(['client', 'technician', 'location', 'serviceCategory', 'photos']);

        return response()->json([
            'message' => 'Technician assigned successfully',
            'data' => $this->formatOrder($order, $request),
        ]);
    }

    /**
     * Format order data for response
     */
    private function formatOrder(Order $order, $request = null): array
    {
        $baseUrl = $request ? $request->getSchemeAndHttpHost() : config('app.url');

        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'client_id' => $order->client_id,
            'client' => $order->client ? [
                'id' => $order->client->id,
                'name' => $order->client->name,
            ] : null,
            'technician_id' => $order->technician_id,
            'technician' => $order->technician ? [
                'id' => $order->technician->id,
                'first_name' => $order->technician->first_name,
                'last_name' => $order->technician->last_name,
            ] : null,
            'location_id' => $order->location_id,
            'location' => $order->location ? [
                'id' => $order->location->id,
                'name' => $order->location->name,
                'address' => $order->location->address,
                'number' => $order->location->number,
                'zip' => $order->location->zip,
                'nip' => $order->location->nip,
                'country' => $order->location->country,
                'city' => $order->location->city,
            ] : null,
            'service_category_id' => $order->service_category_id,
            'service_category' => $order->serviceCategory ? [
                'id' => $order->serviceCategory->id,
                'name' => $order->serviceCategory->name,
                'color' => $order->serviceCategory->color,
            ] : null,
            'status' => $order->status,
            'description' => $order->description,
            'stop_reason' => $order->stop_reason,
            'vat_rate' => $order->vat_rate,
            'is_emergency' => $order->is_emergency,
            'client_ref_no' => $order->client_ref_no,
            'invoice_no' => $order->invoice_no,
            'price_total' => $order->price_total,
            'work_report' => $order->work_report,
            'photos' => $order->photos->map(fn($photo) => [
                'id' => $photo->id,
                'url' => $baseUrl . $photo->url,
                'created_at' => $photo->created_at,
            ]) ?? [],
            'order_date' => $order->order_date,
            'start_at' => $order->start_at,
            'end_at' => $order->end_at,
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
        ];
    }


    /**
     * Upload photos for an order
     */
    public function uploadPhotos(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Check access
        if ($user->role === 'client') {
            $client = $user->client;
            if (!$client || $order->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($user->role === 'technician') {
            if ($order->technician_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        try {
            $validated = $request->validate([
                'photos.*' => 'required|image|max:2048',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        }

        $uploadedPhotos = [];

        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                $path = $file->store('orders/' . $order->id, 'public');

                $photo = $order->photos()->create([
                    'url' => '/storage/' . $path,
                ]);

                $uploadedPhotos[] = [
                    'id' => $photo->id,
                    'url' => config('app.url') . $photo->url,
                    'created_at' => $photo->created_at,
                ];
            }
        }

        $baseUrl = $request->getSchemeAndHttpHost();
        $allPhotos = $order->photos->map(fn($p) => [
            'id' => $p->id,
            'url' => $baseUrl . $p->url,
            'created_at' => $p->created_at,
        ]);

        return response()->json([
            'message' => 'Photos uploaded successfully',
            'data' => $allPhotos,
        ], 201);
    }

    /**
     * Delete a photo from an order
     */
    public function deletePhoto(Request $request, Order $order, $photoId): JsonResponse
    {
        $user = $request->user();

        // Check access
        if ($user->role === 'client') {
            $client = $user->client;
            if (!$client || $order->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($user->role === 'technician') {
            if ($order->technician_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $photo = $order->photos()->find($photoId);

        if (!$photo) {
            return response()->json(['message' => 'Photo not found'], 404);
        }

        $photo->delete();

        return response()->json(['message' => 'Photo deleted successfully']);
    }

    /**
     * Get photos for an order
     */
    public function getPhotos(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Check access
        if ($user->role === 'client') {
            $client = $user->client;
            if (!$client || $order->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($user->role === 'technician') {
            if ($order->technician_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $baseUrl = $request->getSchemeAndHttpHost();
        $photos = $order->photos->map(fn($p) => [
            'id' => $p->id,
            'url' => $baseUrl . $p->url,
            'created_at' => $p->created_at,
        ]);

        return response()->json(['data' => $photos]);
    }

    /**
     * Generate unique order number
     */
    private function generateOrderNumber(): string
    {
        $timestamp = time();
        $random = str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
        return 'ORD-' . date('Ymd') . '-' . $random;
    }
}
