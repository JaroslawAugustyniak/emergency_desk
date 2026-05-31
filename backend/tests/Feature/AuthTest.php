<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user registration
     */
    public function test_user_can_register()
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Registration successful. Please verify your email.',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'name' => 'John Doe',
        ]);
    }

    /**
     * Test registration validation
     */
    public function test_registration_requires_valid_email()
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'John Doe',
            'email' => 'invalid-email',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test email verification
     */
    public function test_user_can_verify_email()
    {
        $user = User::factory()->create([
            'verification_code' => '123456',
            'verification_code_expires' => now()->addMinutes(15),
        ]);

        $response = $this->postJson('/api/auth/verify-email', [
            'email' => $user->email,
            'code' => '123456',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Email verified successfully',
            ]);

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
    }

    /**
     * Test invalid verification code
     */
    public function test_invalid_verification_code_fails()
    {
        $user = User::factory()->create([
            'verification_code' => '123456',
            'verification_code_expires' => now()->addMinutes(15),
        ]);

        $response = $this->postJson('/api/auth/verify-email', [
            'email' => $user->email,
            'code' => '654321',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
            ]);
    }

    /**
     * Test expired verification code
     */
    public function test_expired_verification_code_fails()
    {
        $user = User::factory()->create([
            'verification_code' => '123456',
            'verification_code_expires' => now()->subMinutes(1),
        ]);

        $response = $this->postJson('/api/auth/verify-email', [
            'email' => $user->email,
            'code' => '123456',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid or expired verification code',
            ]);
    }

    /**
     * Test user login
     */
    public function test_user_can_login()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Login successful',
            ])
            ->assertJsonStructure([
                'data' => ['access_token'],
            ]);
    }

    /**
     * Test login with unverified email
     */
    public function test_login_fails_with_unverified_email()
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'email_verified_at' => null,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Email not verified. Verification code sent.',
            ]);
    }

    /**
     * Test login with invalid credentials
     */
    public function test_login_fails_with_invalid_credentials()
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'wrong_password',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid email or password',
            ]);
    }

    /**
     * Test password reset request
     */
    public function test_user_can_request_password_reset()
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Password reset code sent to your email',
            ]);

        $user->refresh();
        $this->assertNotNull($user->reset_password_token);
    }

    /**
     * Test logout
     */
    public function test_user_can_logout()
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Logout successful',
            ]);
    }

    /**
     * Test get current user
     */
    public function test_can_get_current_user()
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'id',
                'name',
                'email',
            ]);
    }
}