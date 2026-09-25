<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\PushSubscription;
use App\Models\PushNotification;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Laravel\Sanctum\PersonalAccessToken;

class PushNotificationController extends Controller
{
    /**
     * Get authenticated user from Authorization token
     */
    private function getAuthenticatedUser(Request $request)
    {
        // First try Laravel's built-in user() which respects auth middleware
        $user = $request->user();
        if ($user) {
            return $user;
        }

        // Fallback: manually parse Bearer token from Authorization header
        $token = $request->bearerToken();
        if (!$token) {
            return null;
        }

        $personalAccessToken = PersonalAccessToken::findToken($token);
        return $personalAccessToken?->tokenable;
    }

    /**
     * Send test push notification to current user's subscriptions
     */
    public function sendTestNotification(Request $request): JsonResponse
    {
        try {
            // Debug: Log authorization header
            $authHeader = $request->header('Authorization');
            if (!$authHeader) {
                \Log::warning('Push test: Missing Authorization header');
            }

            $user = $this->getAuthenticatedUser($request);
            if (!$user) {
                \Log::warning('Push test: User not authenticated', [
                    'auth_header' => $authHeader ? 'present' : 'missing',
                    'bearer_token' => $request->bearerToken() ? 'present' : 'missing',
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                    'debug' => [
                        'auth_header' => $authHeader ? 'present' : 'missing',
                        'bearer_token' => $request->bearerToken() ? 'present' : 'missing',
                    ]
                ], 401);
            }

            \Log::info('Push test: User authenticated', ['user_id' => $user->id]);

            $subscriptions = PushSubscription::where('user_id', $user->id)->get();

            if ($subscriptions->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No push subscriptions found for this user',
                ], 404);
            }

            $message = [
                'title' => 'Hello from Emergency Desk',
                'body' => 'This is a test push notification!',
                'icon' => '/images/favicon.png',
                'badge' => '/images/favicon.png',
                'tag' => 'test-notification',
                'requireInteraction' => false,
            ];

            $vapidPublicKey = env('VAPID_PUBLIC_KEY');
            $vapidPrivateKey = env('VAPID_PRIVATE_KEY');

            if (!$vapidPublicKey || !$vapidPrivateKey) {
                return response()->json([
                    'success' => false,
                    'message' => 'VAPID keys not configured',
                ], 500);
            }

            $webPush = new WebPush([
                'VAPID' => [
                    'subject' => 'mailto:' . env('MAIL_FROM_ADDRESS', 'no-reply@emergencydesk.com'),
                    'publicKey' => $vapidPublicKey,
                    'privateKey' => $vapidPrivateKey,
                ],
            ]);

            $successCount = 0;
            $failureCount = 0;

            foreach ($subscriptions as $subscription) {
                try {
                    $pushSubscription = Subscription::create([
                        'endpoint' => $subscription->endpoint,
                        'publicKey' => $subscription->p256dh,
                        'authToken' => $subscription->auth,
                    ]);

                    $webPush->queueNotification(
                        $pushSubscription,
                        json_encode($message)
                    );

                    $successCount++;
                } catch (\Exception $e) {
                    \Log::error('Failed to queue notification for subscription', [
                        'subscription_id' => $subscription->id,
                        'error' => $e->getMessage(),
                    ]);
                    $failureCount++;
                }
            }

            $webPush->flush();

            return response()->json([
                'success' => true,
                'message' => 'Test notifications sent',
                'data' => [
                    'sent' => $successCount,
                    'failed' => $failureCount,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Test notification error', ['error' => $e->getMessage()]);
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

            $user = $this->getAuthenticatedUser($request);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            PushSubscription::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'endpoint' => $validated['endpoint'],
                ],
                [
                    'p256dh' => $validated['p256dh'],
                    'auth' => $validated['auth'],
                ]
            );

            \Log::info('Push subscription registered', [
                'endpoint' => substr($validated['endpoint'], 0, 50) . '...',
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Subscription registered successfully',
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to register subscription', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to register subscription: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove a push subscription (user disabled notifications)
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'endpoint' => 'required|string',
            ]);

            $user = $this->getAuthenticatedUser($request);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            PushSubscription::where('user_id', $user->id)
                ->where('endpoint', $validated['endpoint'])
                ->delete();

            \Log::info('Push subscription removed', [
                'endpoint' => substr($validated['endpoint'], 0, 50) . '...',
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Subscription removed successfully',
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to remove subscription', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove subscription: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get unread push notifications for the current user
     */
    public function getUnreadNotifications(Request $request): JsonResponse
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            $notifications = PushNotification::where('user_id', $user->id)
                ->where('is_read', false)
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $notifications,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to get unread notifications', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to get notifications: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, $notificationId): JsonResponse
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            $notification = PushNotification::where('id', $notificationId)
                ->where('user_id', $user->id)
                ->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification not found',
                ], 404);
            }

            $notification->update(['is_read' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read',
                'data' => $notification,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to mark notification as read', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as read: ' . $e->getMessage(),
            ], 500);
        }
    }
}
