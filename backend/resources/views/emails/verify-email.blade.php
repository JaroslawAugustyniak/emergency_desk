<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin: 0;">Verify Your Email</h2>
    </div>

    <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Hello <strong>{{ $user->name }}</strong>,
    </p>

    <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Thank you for registering! Please use the verification code below to confirm your email address.
    </p>

    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">
            {{ $code }}
        </div>
    </div>

    <p style="color: #666; font-size: 16px; line-height: 1.6;">
        This code will expire in 15 minutes.
    </p>

    <p style="color: #999; font-size: 14px; line-height: 1.6; margin-top: 30px;">
        If you didn't register for this account, you can safely ignore this email.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; line-height: 1.6;">
        © {{ date('Y') }} Starter App. All rights reserved.
    </p>
</div>