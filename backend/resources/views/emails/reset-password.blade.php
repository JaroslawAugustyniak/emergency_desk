<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin: 0;">Reset Your Password</h2>
    </div>

    <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Hello <strong>{{ $user->name }}</strong>,
    </p>

    <p style="color: #666; font-size: 16px; line-height: 1.6;">
        We received a request to reset your password. Click the link below to create a new password.
    </p>

    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $resetLink }}" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
        </a>
    </div>

    <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center;">
        Or copy and paste this link in your browser:<br>
        <span style="color: #0066cc; word-break: break-all;">{{ $resetLink }}</span>
    </p>

    <p style="color: #666; font-size: 16px; line-height: 1.6;">
        This token will expire in 15 minutes.
    </p>

    <p style="color: #999; font-size: 14px; line-height: 1.6; margin-top: 30px;">
        If you didn't request to reset your password, you can safely ignore this email.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; line-height: 1.6;">
        © {{ date('Y') }} Starter App. All rights reserved.
    </p>
</div>