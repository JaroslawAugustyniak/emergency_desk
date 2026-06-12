<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users',
                'password' => 'required|string|min:8|confirmed',
            ]);

            $user = $this->authService->register($validated);

            return response()->json([
                'success' => true,
                'message' => 'Registration successful. Please verify your email.',
                'data' => ['email' => $user->email],
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email|exists:users',
                'code' => 'required|string|size:6',
            ]);

            $user = User::where('email', $validated['email'])->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            if (!$this->authService->verifyEmail($user, $validated['code'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired verification code',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Email verified successfully',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Verification failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function login(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            $user = $this->authService->login($validated['email'], $validated['password']);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid email or password',
                ], 401);
            }

            // Generate and send 2FA code
            $this->authService->sendVerificationEmail($user);

            return response()->json([
                'success' => true,
                'message' => 'Verification code sent to your email',
                'data' => [
                    'email' => $user->email,
                ],
            ]);
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'Email not verified')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email not verified. Verification code sent.',
                ], 403);
            }

            return response()->json([
                'success' => false,
                'message' => 'Login failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function verify2FA(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email|exists:users',
                'code' => 'required|string|size:6',
            ]);

            $user = User::where('email', $validated['email'])->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            if (!$this->authService->verifyEmail($user, $validated['code'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired verification code',
                ], 400);
            }

            // Code verified, generate token
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => '2FA verified successfully',
                'data' => [
                    'user' => $user,
                    'access_token' => $token,
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '2FA verification failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function resendVerification(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email|exists:users',
            ]);

            $user = User::where('email', $validated['email'])->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            $this->authService->sendVerificationEmail($user);

            return response()->json([
                'success' => true,
                'message' => 'Verification code sent to your email',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send verification code: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getProfile(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get profile: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,' . $request->user()->id,
                'password' => 'nullable|string|min:8',
                'currentPassword' => 'nullable|string',
            ]);

            $user = $request->user();

            // If changing password, verify current password
            if (!empty($validated['password'])) {
                if (empty($validated['currentPassword'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Current password is required to change password',
                    ], 422);
                }

                if (!Hash::check($validated['currentPassword'], $user->password)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Current password is incorrect',
                    ], 422);
                }

                $user->update([
                    'password' => Hash::make($validated['password']),
                ]);
            }

            // Update name and email
            $user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email|exists:users',
            ]);

            $user = User::where('email', $validated['email'])->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            $this->authService->sendPasswordResetCode($user);

            return response()->json([
                'success' => true,
                'message' => 'Password reset code sent to your email',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Request failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function validateResetToken(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'token' => 'required|string',
            ]);

            $user = User::where('reset_password_token', $validated['token'])->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired reset token',
                ], 400);
            }

            if ($user->reset_password_expires < now()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Reset token has expired',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Token is valid',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function resetPassword(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email|exists:users',
                'token' => 'required|string',
                'password' => 'required|string|min:8',
            ]);

            $user = User::where('email', $validated['email'])->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            if (!$user->reset_password_token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired reset token',
                ], 400);
            }

            if (!$this->authService->resetPassword($user, $validated['token'], $validated['password'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired reset token',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Password reset failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
