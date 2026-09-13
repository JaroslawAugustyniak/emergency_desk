<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\PushSubscription;
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
            $user = $this->getAuthenticatedUser($request);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

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
}
