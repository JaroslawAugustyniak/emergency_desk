'use server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://api.starter.localhost";

export type UpdateProfileData = {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  currentPassword?: string;
};

export async function getProfile(token?: string) {
  try {
    // If token is not provided, we can't get the profile
    // This should be called from client with the token from localStorage
    if (!token) {
      throw new Error('Unauthorized');
    }

    const res = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to get profile');
    }

    return data.data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to get profile');
  }
}

export async function updateProfile(token: string, profileData: UpdateProfileData) {
  try {
    if (!token) {
      throw new Error('Unauthorized');
    }

    // Validate required fields
    if (!profileData.first_name || profileData.first_name.trim().length === 0) {
      throw new Error('NAME_REQUIRED');
    }

    if (!profileData.last_name || profileData.last_name.trim().length === 0) {
      throw new Error('NAME_REQUIRED');
    }

    if (!profileData.email || profileData.email.trim().length === 0) {
      throw new Error('EMAIL_REQUIRED');
    }

    // Prepare request data
    const requestData: any = {
      first_name: profileData.first_name.trim(),
      last_name: profileData.last_name.trim(),
      email: profileData.email.trim(),
    };

    // Handle password change
    if (profileData.password && profileData.password.length > 0) {
      if (!profileData.currentPassword) {
        throw new Error('CURRENT_PASSWORD_REQUIRED');
      }
      requestData.password = profileData.password;
      requestData.currentPassword = profileData.currentPassword;
    }

    const res = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });

    const data = await res.json();

    if (!res.ok) {
      // Map backend error messages to frontend error codes
      if (data.message === 'Current password is incorrect') {
        throw new Error('CURRENT_PASSWORD_INCORRECT');
      }
      if (data.message === 'Current password is required to change password') {
        throw new Error('CURRENT_PASSWORD_REQUIRED');
      }
      if (data.errors?.email?.includes('already been taken')) {
        throw new Error('EMAIL_IN_USE');
      }
      throw new Error(data.message || 'Failed to update profile');
    }

    return data.data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update profile');
  }
}