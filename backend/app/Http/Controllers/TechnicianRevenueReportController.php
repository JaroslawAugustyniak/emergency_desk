<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class TechnicianRevenueReportController extends Controller
{
    /**
     * Get revenue summary for all technicians
     */
    public function revenueSummary(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'from_date' => 'required|date_format:Y-m-d',
                'to_date' => 'required|date_format:Y-m-d|after_or_equal:from_date',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        }

        $fromDate = Carbon::parse($validated['from_date'])->startOfDay();
        $toDate = Carbon::parse($validated['to_date'])->endOfDay();

        $technicians = User::where('role', 'technician')
            ->where('status', 'active')
            ->get();

        $data = $technicians->map(function ($technician) use ($fromDate, $toDate) {
            $orders = Order::where('technician_id', $technician->id)
                ->whereIn('status', ['completed', 'invoiced'])
                ->whereBetween('end_at', [$fromDate, $toDate])
                ->with('materials')
                ->get();

            $totalRevenue = $orders->sum('price_total') ?? 0;

            $totalMaterialsCost = 0;
            foreach ($orders as $order) {
                if ($order->materials) {
                    $totalMaterialsCost += $order->materials->sum('price');
                }
            }

            return [
                'id' => $technician->id,
                'name' => $technician->first_name . ' ' . $technician->last_name,
                'email' => $technician->email,
                'revenue' => (float) $totalRevenue,
                'materials_cost' => (float) $totalMaterialsCost,
                'income' => (float) ($totalRevenue - $totalMaterialsCost),
                'orders_count' => $orders->count(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $data->values(),
            'period' => [
                'from_date' => $fromDate->toDateString(),
                'to_date' => $toDate->toDateString(),
            ],
        ]);
    }

    /**
     * Get detailed revenue report for a specific technician
     */
    public function technicianDetail(Request $request, User $technician): JsonResponse
    {
        if ($technician->role !== 'technician') {
            return response()->json([
                'message' => 'User is not a technician',
            ], 404);
        }

        try {
            $validated = $request->validate([
                'from_date' => 'required|date_format:Y-m-d',
                'to_date' => 'required|date_format:Y-m-d|after_or_equal:from_date',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        }

        $fromDate = Carbon::parse($validated['from_date'])->startOfDay();
        $toDate = Carbon::parse($validated['to_date'])->endOfDay();

        $orders = Order::where('technician_id', $technician->id)
            ->whereIn('status', ['completed', 'invoiced'])
            ->whereBetween('end_at', [$fromDate, $toDate])
            ->with(['client', 'location', 'serviceCategory', 'materials'])
            ->get();

        $totalRevenue = $orders->sum('price_total') ?? 0;

        $totalMaterialsCost = 0;
        $ordersData = $orders->map(function ($order) use (&$totalMaterialsCost) {
            $materialsCost = $order->materials ? $order->materials->sum('price') : 0;
            $totalMaterialsCost += $materialsCost;

            return [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'client' => $order->client->name ?? 'N/A',
                'service_category' => $order->serviceCategory->name ?? 'N/A',
                'location' => $order->location->city . ', ' . $order->location->street ?? 'N/A',
                'revenue' => (float) $order->price_total,
                'materials_cost' => (float) $materialsCost,
                'income' => (float) ($order->price_total - $materialsCost),
                'end_at' => $order->end_at?->toDateString(),
                'status' => $order->status,
            ];
        });

        return response()->json([
            'status' => 'success',
            'technician' => [
                'id' => $technician->id,
                'name' => $technician->first_name . ' ' . $technician->last_name,
                'email' => $technician->email,
            ],
            'summary' => [
                'total_revenue' => (float) $totalRevenue,
                'total_materials_cost' => (float) $totalMaterialsCost,
                'total_income' => (float) ($totalRevenue - $totalMaterialsCost),
                'orders_count' => $orders->count(),
            ],
            'orders' => $ordersData->values(),
            'period' => [
                'from_date' => $fromDate->toDateString(),
                'to_date' => $toDate->toDateString(),
            ],
        ]);
    }
}
