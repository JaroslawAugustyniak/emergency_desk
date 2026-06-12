<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\UserController;
use App\Mail\VerifyEmailMail;
use App\Mail\ResetPasswordMail;
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

Route::get('/test-email', function () {
    try {
        $user = User::find(1);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User with ID 1 not found',
            ], 404);
        }

        Mail::queue(new ResetPasswordMail($user, 'test_token_12345'));

        return response()->json([
            'status' => 'success',
            'message' => 'Test email queued successfully for ' . $user->email,
            'timestamp' => now(),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to queue test email: ' . $e->getMessage(),
        ], 500);
    }
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/verify-email/resend', [AuthController::class, 'resendVerification']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/verify-2fa', [AuthController::class, 'verify2FA']);
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

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/technicians', [UserController::class, 'technicians']);
        Route::get('/clients', [UserController::class, 'clients']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
    });
});
