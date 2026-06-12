"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://api.starter.localhost";

export async function login(email: string, password: string, remember_me: boolean = false) {
  if (!email || !password) {
    return { success: false, error: "Invalid credentials", statusCode: 400 };
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, remember_me }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.message || "Login failed",
        statusCode: res.status,
      };
    }

    return {
      success: true,
      data: data.data,
      statusCode: 200,
    };
  } catch (error: any) {
    return { success: false, error: "Login failed. Please try again.", statusCode: 500 };
  }
}
