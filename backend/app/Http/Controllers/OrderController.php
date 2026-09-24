<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\OrderPdfService;
use App\Services\PhotoService;
use App\Services\ImageOptimizationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Support\Facades\Mail;
use App\Mail\ProtocolMail;
use App\Events\TechnicianAssignedToOrder;
use App\Listeners\SendTechnicianNotificationListener;
use App\Services\PushNotificationQueueService;

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
                'status' => 'string|in:new,assigned,in_progress,paused,finished,completed,invoiced',
                'sort_by' => 'string|in:id,status,order_date,created_at',
                'sort_order' => 'string|in:asc,desc',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        }

        $user = $request->user();

        // Clean up abandoned temporary photos from previous sessions
        $this->cleanupAbandonedTemporaryPhotos($user);
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
        // Admin and tech_manager see all orders

        if ($search) {
            $query->leftJoin('clients', 'orders.client_id', '=', 'clients.id')
                  ->leftJoin('locations', 'orders.location_id', '=', 'locations.id')
                  ->where(function ($q) use ($search) {
                      $q->where('orders.description', 'like', "%{$search}%")
                        ->orWhere('orders.invoice_no', 'like', "%{$search}%")
                        ->orWhere('orders.id', 'like', "%{$search}%")
                        ->orWhere('clients.name', 'like', "%{$search}%")
                        ->orWhere('locations.address', 'like', "%{$search}%")
                        ->orWhere('locations.city', 'like', "%{$search}%");
                  })
                  ->distinct()
                  ->select('orders.*');
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
        // Admin and tech_manager can view all

        $order->load(['client', 'technician', 'location.user', 'serviceCategory', 'photos']);
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
                'service_category_id' => [
                    'nullable',
                    'integer',
                    'min:0',
                    function ($attribute, $value, $fail) {
                        if ($value > 0 && !\App\Models\ServiceCategory::where('id', $value)->exists()) {
                            $fail('The service category does not exist.');
                        }
                    },
                ],
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
            'service_category_id' => $validated['service_category_id'] ?? null,
            'description' => $validated['description'] ?? null,
            'is_emergency' => $validated['is_emergency'] ?? false,
            'client_ref_no' => $validated['client_ref_no'] ?? null,
            'status' => 'new',
            'order_date' => now(),
        ]);

        // Assign temporary photos uploaded by the user to this order
        \App\Models\Photo::where('user_id', $user->id)
            ->whereNull('order_id')
            ->where('type', 'temporary')
            ->update([
                'order_id' => $order->id,
                'type' => 'issue',
            ]);

        // Move photo files from temporary folder to order-specific folder
        $photoService = new PhotoService();
        $photoService->moveTemporaryPhotosToOrder($order);

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
                'technician_signature' => 'nullable|string',
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
            $updateData = array_intersect_key($updateData, array_flip(['work_report', 'technician_signature']));
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
            $allowedStatuses = ['in_progress', 'paused', 'finished', 'completed'];
        } elseif ($user->role === 'client') {
            return response()->json(['message' => 'Clients cannot change order status'], 403);
        } else {
            // Admin can use all statuses
            $allowedStatuses = ['new', 'assigned', 'in_progress', 'paused', 'finished', 'completed', 'invoiced'];
        }

        try {
            $rules = [
                'status' => 'required|string|in:' . implode(',', $allowedStatuses),
                'stop_reason' => 'nullable|string',
                'price_total' => 'nullable|numeric|min:0',
            ];

            // Invoice number required when changing to invoiced status
            if ($request->get('status') === 'invoiced') {
                $rules['invoice_no'] = 'required|string|min:1';
            }

            $validated = $request->validate($rules);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        }

        $status = $validated['status'];

        // Auto-determine status for finish repair flow
        if ($status === 'completed' && isset($validated['price_total'])) {
            $priceTotal = $validated['price_total'];
            if ($priceTotal === null || $priceTotal <= 0) {
                $status = 'finished';
            }
        }

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
                $order->prepaused_status = $order->status;
                $order->start_at = $order->start_at ?? now();
            }
            if ($status === 'completed') {
                if (!$order->start_at) {
                    $order->start_at = now();
                }
                $order->end_at = now();
            }
            if ($status === 'finished') {
                if (!$order->start_at) {
                    $order->start_at = now();
                }
                $order->end_at = now();
            }
        } else {
            // Admin
            if ($status === 'paused') {
                $order->stop_reason = $validated['stop_reason'] ?? null;
                $order->prepaused_status = $order->status;
            }
            if ($status === 'invoiced') {
                $order->invoice_no = $validated['invoice_no'] ?? null;
            }
        }

        // Handle price_total for completed/finished transition
        if (($status === 'completed' || $status === 'finished') && array_key_exists('price_total', $validated)) {
            $priceValue = $validated['price_total'];
            $order->price_total = ($priceValue && $priceValue > 0) ? $priceValue : null;
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
    public function assignTechnician(Request $request, Order $order, PushNotificationQueueService $queueService): JsonResponse
    {
        $user = $request->user();

        // Only admin and tech_manager can assign technicians
        if (!in_array($user->role, ['admin', 'tech_manager'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

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

        $previousTechnicianId = $order->technician_id;

        $order->technician_id = $validated['technician_id'];
        $order->status = 'assigned';
        if (isset($validated['is_emergency'])) {
            $order->is_emergency = $validated['is_emergency'];
        }
        $order->save();

        // The technician changed - cancel the outgoing technician's pending push
        // notification so they don't get notified about an order they're no longer on.
        if ($previousTechnicianId && $previousTechnicianId !== $order->technician_id) {
            $queueService->cancelPending($previousTechnicianId, SendTechnicianNotificationListener::NOTIFICATION_TYPE);
        }

        // Emit event to queue push notification
        TechnicianAssignedToOrder::dispatch($order, $order->technician);

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
                'description' => $order->location->description,
                'city' => $order->location->city,
                'user' => $order->location->user ? [
                    'id' => $order->location->user->id,
                    'first_name' => $order->location->user->first_name,
                    'last_name' => $order->location->user->last_name,
                    'email' => $order->location->user->email,
                ] : null,
            ] : null,
            'service_category_id' => $order->service_category_id,
            'service_category' => $order->serviceCategory ? [
                'id' => $order->serviceCategory->id,
                'name' => $order->serviceCategory->name,
                'color' => $order->serviceCategory->color,
            ] : null,
            'status' => $order->status,
            'description' => $order->description,
            'technician_signature' => $order->technician_signature,
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
                'type' => $photo->type,
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
     * Upload photos for an order or temporarily for the current user
     */
    public function uploadPhotos(Request $request): JsonResponse
    {
        $user = $request->user();

        $routeOrder = $request->route('order');

        \Log::info('uploadPhotos called', [
            'path' => $request->path(),
            'route_order_raw' => $routeOrder,
            'route_order_type' => gettype($routeOrder),
            'user_id' => $user?->id,
        ]);

        // Get order from route parameter if exists
        // Route binding already converts {order} to Order instance
        $order = null;
        if ($routeOrder instanceof Order) {
            $order = $routeOrder;
        } elseif ($routeOrder) {
            $order = Order::findOrFail($routeOrder);
        }

        // Check access if order exists
        if ($order) {
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
        }

        try {
            // Walidacja: max 10MB (10240 KB)
            // Po optymalizacji pliki będą znacznie mniejsze (80-90% redukcji)
            $validated = $request->validate(
                [
                    'photos.*' => 'required|image|max:10240',
                    'type' => 'required|in:issue,work_completed,temporary',
                ],
                [
                    'photos.*.required' => 'Zdjęcie jest wymagane.',
                    'photos.*.image' => 'Wybrany plik nie jest zdjęciem. Obsługiwane formaty: JPEG, PNG, GIF, WebP.',
                    'photos.*.max' => 'Zdjęcie jest zbyt duże. Maksymalny rozmiar to 10 MB. Wybrany plik ma :size kB. Spróbuj wybrać zdjęcie o mniejszej rozdzielczości lub mniejszym rozmiarze. Uwaga: Zdjęcia z aparatów profesjonalnych mogą być większe - spróbuj je najpierw skompresować na komputerze.',
                    'type.required' => 'Typ zdjęcia jest wymagany.',
                    'type.in' => 'Typ zdjęcia musi być jednym z: issue, work_completed, temporary.',
                ]
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Zwróć przystępne komunikaty dla użytkownika
            return response()->json([
                'message' => 'Wgrywanie zdjęć nie powiodło się',
                'errors' => $this->formatValidationErrors($e->errors()),
            ], 422);
        }

        $photoType = $validated['type'];
        $uploadedPhotos = [];
        $uploadDir = $order ? 'orders/' . $order->id : 'temporary/' . $user->id;

        // Zainicjuj serwis do optymalizacji zdjęć
        $imageOptimizer = new ImageOptimizationService();

        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                // Zoptymalizuj obraz przed zapisaniem
                // - Zmniejszy rozmiar jeśli potrzeba
                // - Skomprymuje obraz
                // - Konwertuje format na JPEG (dla lepszej kompresji)
                // - Usuwa metadata EXIF (bezpieczeństwo)
                $path = $imageOptimizer->optimizeAndStore($file, $uploadDir);

                $photoData = [
                    'url' => '/storage/' . $path,
                ];

                // If order exists, attach to order; otherwise attach to user as temporary
                if ($order) {
                    // When adding to existing order, always use the requested type (issue or work_completed)
                    $photoData['type'] = $photoType === 'temporary' ? 'issue' : $photoType;
                    $photoData['order_id'] = $order->id;
                    $photo = $order->photos()->create($photoData);
                } else {
                    // For temporary uploads, create with user_id and type='temporary'
                    $photoData['type'] = 'temporary';
                    $photoData['user_id'] = $user->id;
                    $photo = \App\Models\Photo::create($photoData);
                }

                $uploadedPhotos[] = [
                    'id' => $photo->id,
                    'url' => config('app.url') . $photo->url,
                    'type' => $photo->type,
                    'created_at' => $photo->created_at,
                ];
            }
        }

        $baseUrl = $request->getSchemeAndHttpHost();

        // Return photos of the appropriate type
        if ($order) {
            $allPhotos = $order->photos->where('type', $photoType)->map(fn($p) => [
                'id' => $p->id,
                'url' => $baseUrl . $p->url,
                'type' => $p->type,
                'created_at' => $p->created_at,
            ])->values();
        } else {
            // Return user's temporary photos (not yet assigned to any order)
            $allPhotos = \App\Models\Photo::where('user_id', $user->id)
                ->whereNull('order_id')
                ->get()
                ->map(fn($p) => [
                    'id' => $p->id,
                    'url' => $baseUrl . $p->url,
                    'type' => $p->type,
                    'created_at' => $p->created_at,
                ])->values();
        }

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
     * Get photos for an order, optionally filtered by type
     */
    public function getPhotos(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get order from route parameter
        $orderParam = $request->route('order');
        if (!$orderParam) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $order = $orderParam instanceof Order ? $orderParam : Order::findOrFail($orderParam);

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

        $type = $request->query('type'); // Optional filter: 'issue' or 'work_completed'
        $query = $order->photos();

        if ($type && in_array($type, ['issue', 'work_completed'])) {
            $query = $query->where('type', $type);
        }

        $baseUrl = $request->getSchemeAndHttpHost();
        $photos = $query->get()->map(fn($p) => [
            'id' => $p->id,
            'url' => $baseUrl . $p->url,
            'type' => $p->type,
            'created_at' => $p->created_at,
        ]);

        return response()->json(['data' => $photos]);
    }

    /**
     * Save materials for an order
     */
    public function saveMaterials(Request $request, Order $order): JsonResponse
    {
        // $user = $request->user();

        // Check access - only technician assigned to order or admin
        // if ($user->role === 'technician' && $order->technician_id !== $user->id) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // } elseif ($user->role === 'client') {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }

        $validated = $request->validate([
            'materials' => 'required|array',
            'materials.*.name' => 'required_with:materials.*.price|string|max:255',
            'materials.*.price' => 'required_with:materials.*.name|numeric|min:0',
        ]);

        // Delete existing materials
        $order->materials()->delete();

        // Save only non-empty materials
        $materials = collect($validated['materials'])
            ->filter(fn($m) => !empty($m['name']) && !empty($m['price']))
            ->values()
            ->toArray();

        foreach ($materials as $material) {
            $order->materials()->create($material);
        }

        $savedMaterials = $order->materials->map(fn($m) => [
            'id' => $m->id,
            'name' => $m->name,
            'price' => $m->price,
        ]);

        $totalPrice = $order->materials->sum('price');

        return response()->json([
            'message' => 'Materials saved successfully',
            'data' => $savedMaterials,
            'total_price' => $totalPrice,
        ]);
    }

    /**
     * Get materials for an order
     */
    public function getMaterials(Request $request, Order $order): JsonResponse
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

        $materials = $order->materials->map(fn($m) => [
            'id' => $m->id,
            'name' => $m->name,
            'price' => $m->price,
        ]);

        $totalPrice = $order->materials->sum('price');

        return response()->json([
            'data' => $materials,
            'total_price' => $totalPrice,
        ]);
    }

    /**
     * Delete a material
     */
    public function deleteMaterial(Request $request, Order $order, $materialId): JsonResponse
    {
        $user = $request->user();

        // Check access - only technician assigned to order or admin
        if ($user->role === 'technician' && $order->technician_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        } elseif ($user->role === 'client') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $material = $order->materials()->find($materialId);

        if (!$material) {
            return response()->json(['message' => 'Material not found'], 404);
        }

        $material->delete();

        return response()->json(['message' => 'Material deleted successfully']);
    }

    /**
     * Pause an order with a reason, or resume a paused order
     */
    public function pause(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Only admin and tech_manager can pause/resume orders
        if (!in_array($user->role, ['admin', 'tech_manager', 'technician'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Handle resume (order is already paused)
        if ($order->status === 'paused') {
            // Can only resume if prepaused_status exists
            if (!$order->prepaused_status) {
                return response()->json([
                    'message' => 'Cannot restore previous status: prepaused status not found',
                    'error' => 'Missing prepaused status'
                ], 422);
            }

            $order->status = $order->prepaused_status;
            $order->prepaused_status = null;
            // Note: stop_reason is intentionally kept
            $order->save();

            $order->load(['client', 'technician', 'location', 'serviceCategory', 'photos']);

            return response()->json([
                'message' => 'Order resumed successfully',
                'data' => $this->formatOrder($order, $request),
            ]);
        }

        // Handle pause
        if (!in_array($order->status, ['new', 'assigned', 'in_progress'])) {
            return response()->json([
                'message' => 'Cannot pause order with status: ' . $order->status,
                'error' => 'Invalid status transition'
            ], 422);
        }

        try {
            $validated = $request->validate([
                'stop_reason' => 'required|string|max:500',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        }

        $order->prepaused_status = $order->status;
        $order->status = 'paused';
        $order->stop_reason = $validated['stop_reason'];
        $order->save();
        
        $order->load(['client', 'technician', 'location', 'serviceCategory', 'photos']);

        return response()->json([
            'message' => 'Order paused successfully',
            'data' => $this->formatOrder($order, $request),
        ]);
    }

    /**
     * Generate protocol PDF for an order
     */
    public function generateProtocol(Request $request, Order $order, OrderPdfService $pdfService): JsonResponse
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
        // Admin and tech_manager can generate for any order

        try {
            // Delete existing protocol to regenerate
            $pdfService->deleteExistingProtocol($order);

            // Generate new protocol
            $fileName = $pdfService->generateProtocol($order);

            return response()->json([
                'message' => 'Protocol generated successfully',
                'data' => [
                    'file_name' => $fileName,
                    'download_url' => '/api/orders/' . $order->id . '/protocol/download',
                    'generated_at' => date('Y-m-d H:i:s'),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate protocol',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download protocol PDF for an order
     */
    public function downloadProtocol(Request $request, Order $order, OrderPdfService $pdfService): BinaryFileResponse|JsonResponse
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
        // Admin and tech_manager can download for any order

        $filePath = $pdfService->getFilePath($order);

        if (!file_exists($filePath)) {
            return response()->json([
                'message' => 'Protocol file not found. Please generate it first.',
            ], 404);
        }

        return response()->download($filePath, $pdfService->getFileName($order), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $pdfService->getFileName($order) . '"',
        ]);
    }

    public function sendProtocol(Request $request, Order $order, OrderPdfService $pdfService): JsonResponse
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

        $filePath = $pdfService->getFilePath($order);
        if (!file_exists($filePath)) {
            return response()->json([
                'message' => 'Protocol file not found. Please generate it first.',
            ], 404);
        }

        $order->load(['location.user']);
        $manager = $order->location?->user;

        if (!$manager || !$manager->email) {
            return response()->json([
                'message' => 'Location manager not found or has no email',
            ], 404);
        }

        try {
            Mail::to($manager->email)->send(new ProtocolMail($order, $filePath));

            return response()->json([
                'message' => 'Protocol sent successfully to ' . $manager->first_name . ' ' . $manager->last_name,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send protocol',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clean up abandoned temporary photos
     */
    private function cleanupAbandonedTemporaryPhotos($user): void
    {
        // Delete temporary photos older than 24 hours that weren't assigned to an order
        $abandonedPhotos = \App\Models\Photo::where('user_id', $user->id)
            ->whereNull('order_id')
            ->where('type', 'temporary')
            ->where('created_at', '<', now()->subHours(24))
            ->get();

        foreach ($abandonedPhotos as $photo) {
            // Delete file from storage
            $filePath = str_replace('/storage/', '', $photo->url);
            if (\Storage::disk('public')->exists($filePath)) {
                \Storage::disk('public')->delete($filePath);
            }
            $photo->delete();
        }
    }

    /**
     * Format validation errors into user-friendly messages
     * Konwertuje techniczne błędy walidacji na zrozumiałe komunikaty
     */
    private function formatValidationErrors(array $errors): array
    {
        $formatted = [];

        foreach ($errors as $field => $messages) {
            // Parsuj pole aby wyciągnąć indeks (photos.0.image → photos 0)
            preg_match('/(\w+)\.(\d+)\.(\w+)/', $field, $matches);

            if (count($matches) > 0) {
                $fieldName = $matches[1];      // photos
                $fileIndex = $matches[2];       // 0, 1, 2, ...
                $subField = $matches[3];        // image, max, itp

                // Numeruj pliki od 1 dla użytkownika (zamiast od 0)
                $displayIndex = (int)$fileIndex + 1;

                $formatted[] = [
                    'file_number' => $displayIndex,
                    'field' => $fieldName,
                    'error' => $messages[0],
                    'suggestion' => $this->getErrorSuggestion($subField, $messages[0]),
                ];
            } else {
                // Błędy nie związane z plikami (np. type)
                $formatted[] = [
                    'field' => $field,
                    'error' => $messages[0],
                ];
            }
        }

        return $formatted;
    }

    /**
     * Pokaż użytkownikowi co powinien zrobić aby rozwiązać błąd
     */
    private function getErrorSuggestion(string $subField, string $message): ?string
    {
        return match ($subField) {
            'image' => '💡 Wskazówka: Upewnij się, że wybrałeś rzeczywiste zdjęcie (JPEG, PNG, GIF lub WebP), a nie inny typ pliku.',
            'max' => '💡 Wskazówka: Spróbuj otworzyć zdjęcie na komputerze i zmniejsz jego rozmiar lub rozdzielczość przed wysłaniem.',
            'required' => '💡 Wskazówka: Zaznacz co najmniej jedno zdjęcie do wysłania.',
            default => null,
        };
    }

}
