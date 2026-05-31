"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://api.starter.localhost";

export async function validateToken(token: string) {
  if (!token) {
    return { valid: false, error: "Invalid reset link" };
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/validate-reset-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        valid: false,
        error: data.message || "Invalid or expired reset token",
      };
    }

    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: "Failed to validate token" };
  }
}

export async function resetPassword(email: string, token: string, password: string) {
  if (!email || !token || !password) {
    return { error: "Invalid data", success: false };
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        token,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error ?? "Reset password failed: " + JSON.stringify(data.errors), success: false };
    }

    return { success: true };
  } catch (error: any) {
    return { error: "Reset password failed. Please try again.", success: false };
  }
}
