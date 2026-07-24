<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PushNotificationController extends Controller
{
    /**
     * Test endpoint - send hello world push notification
     */
    public function sendTestNotification(Request $request): JsonResponse
    {
        try {
            // In a real scenario, you would:
            // 1. Get the subscription from the database
            // 2. Use a Web Push library to send the notification
            // 3. Handle encryption and signing

            // For now, just return a test message that will be handled by Service Worker
            $message = [
                'title' => 'Hello from Emergency Desk',
                'body' => 'This is a test push notification!',
                'icon' => '/images/favicon.png',
                'badge' => '/images/favicon.png',
                'tag' => 'test-notification',
                'requireInteraction' => false,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Test notification sent successfully',
                'data' => $message,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send notification: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Register subscription endpoint
     * Frontend sends subscription details here
     */
    public function registerSubscription(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'endpoint' => 'required|string',
                'auth' => 'required|string',
                'p256dh' => 'required|string',
            ]);

            // In a real scenario, store this in database
            // For now, just acknowledge receipt

            \Log::info('Push subscription registered', [
                'endpoint' => substr($validated['endpoint'], 0, 50) . '...',
                'user_id' => $request->user()?->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Subscription registered successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to register subscription: ' . $e->getMessage(),
            ], 422);
        }
    }
}
