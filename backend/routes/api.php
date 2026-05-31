<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;
use App\Http\Controllers\Api\AuthController;
use App\Mail\VerifyEmailMail;
use App\Models\User;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::get('/test', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'API is running!',
        'timestamp' => now(),
        'php_version' => phpversion(),
    ]);
});

Route::post('/test-email', function (Request $request) {
    try {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        // Create a test user object
        $testUser = new User([
            'name' => 'Test User',
            'email' => $validated['email'],
        ]);

        // Send test email
        Mail::send(new VerifyEmailMail($testUser, '123456'));

        return response()->json([
            'status' => 'success',
            'message' => 'Test email sent successfully to ' . $validated['email'],
            'timestamp' => now(),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to send test email: ' . $e->getMessage(),
        ], 500);
    }
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/verify-email/resend', [AuthController::class, 'resendVerification']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/validate-reset-token', [AuthController::class, 'validateResetToken']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/profile', [AuthController::class, 'getProfile']);
        Route::post('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', function (Request $request) {
            return $request->user();
        });
    });
});
