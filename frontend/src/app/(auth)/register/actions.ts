"use server";

import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://api.starter.localhost";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const password2 = formData.get("password2") as string;
  const terms = formData.get("terms");

  if (!name || !email || !password || !password2) {
    return { error: "All fields are required" };
  }

  if (!terms) {
    return { error: "You must accept the terms to register" };
  }

  if (password !== password2) {
    return { error: "Passwords do not match" };
  }

  try {
    console.log("🔵 Registering user to:", `${API_URL}/api/auth/register`);
    console.log("📤 Payload:", { name, email, password_confirmation: password2 });

    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: password2,
      }),
    });

    console.log("📥 Response status:", res.status);
    console.log("📥 Response headers:", Object.fromEntries(res.headers.entries()));

    const data = await res.json();
    console.log("📥 Response data:", data);

    if (!res.ok) {
      console.log("❌ Registration failed:", data);
      if (data.message?.includes("email")) {
        return { error: "Email already exists" };
      }
      return { error: data.message || "Registration failed" };
    }

    console.log("✅ Registration successful");
    // Redirect to verification page with email in query
    redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  } catch (error: any) {
    // Re-throw Next.js redirect errors
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    console.error("💥 Catch error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return { error: `Registration failed: ${error.message}` };
  }
}
