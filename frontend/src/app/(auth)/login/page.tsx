"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { useTranslations } from 'next-intl';
import { useSessionContext } from "@/app/components/providers/SessionProvider";
import { login } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reset = searchParams.get('reset');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const { token, isLoading: isSessionLoading, setToken } = useSessionContext();

  useEffect(() => {
    if (!isSessionLoading && token) {
      router.push('/dashboard');
    }
  }, [token, isSessionLoading, router]);

  useEffect(() => {
    if (reset === 'success') {
      Swal.fire({
        title: tCommon('success'),
        text: t('passwordResetSuccess'),
        icon: 'success',
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'OK'
      });
    }
  }, [reset, t]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await login(email, password, rememberMe);

    setIsLoading(false);

    if (!result.success) {
      let errorMessage = t('invalidCredentials');

      if (result.statusCode === 403) {
        errorMessage = t('emailNotVerified');
      } else if (result.error) {
        errorMessage = result.error;
      }

      Swal.fire({
        title: t('loginError'),
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK'
      });
      return;
    }

    
    // Store token and update session
    if (result.data?.access_token) {
      setToken(result.data.access_token, rememberMe);
    }

    // TODO: 2FA verification temporarily disabled - redirect directly to dashboard
    // router.push(`/verify-email?email=${encodeURIComponent(email)}&type=login`);
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-8">
        <Image
          src="/images/logo-an-mar-big.png"
          alt="Logo"
          width={150}
          height={80}
          className="main-logo"
          priority
        />
      </div>
      <form onSubmit={handleSubmit}>
        <input
          name="email"
          type="email"
          className="input"
          required
          placeholder={t('email')}
          disabled={isLoading}
        />
        <input
          name="password"
          type="password"
          className="input"
          required
          placeholder={t('password')}
          disabled={isLoading}
        />

        <div className="flex items-center gap-2 mb-4 mt-3">
          <input
            type="checkbox"
            id="remember_me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
            className="w-4 h-4 rounded cursor-pointer"
          />
          <label htmlFor="remember_me" className="text-sm text-gray-700 cursor-pointer">
            {t('rememberMe') || 'Remember me on this device'}
          </label>
        </div>

        <button
          type="submit"
          className="button"
          disabled={isLoading}
        >
          {isLoading ? '...' : t('login')}
        </button>
        <div className="flex flex-col text-right">
          {/* <a href="/register" className="flex-auto mt-1.5 text-slate-500 text-sm">
            {t('noAccount')}
          </a> */}
          <a href="/forgot-password" className="mt-1.5 text-slate-500 text-sm">
            {t('forgotPassword')}
          </a>
        </div>
      </form>
    </div>
  );
}
