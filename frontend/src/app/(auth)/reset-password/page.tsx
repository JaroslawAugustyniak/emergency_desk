"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useTranslations } from 'next-intl';
import Swal from 'sweetalert2';

import { calculatePasswordStrength, type PasswordStrength, } from "@/lib/passwordStrength";
import { resetPassword, validateToken } from "./actions";


export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const t = useTranslations('auth');
  const tComm = useTranslations('common');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password2: "",
  });

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(formData.password),
    [formData.password]
  );

  useEffect(() => {
    if (!token) {
      Swal.fire({
        title: t('error'),
        text: t('invalidResetLink'),
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK'
      }).then(() => router.push('/forgot-password'));
      return;
    }

    // Validate token on component mount
    (async () => {
      const result = await validateToken(token);
      setTokenValid(result.valid);
      if (!result.valid) {
        Swal.fire({
          title: t('error'),
          text: result.error ?? t('invalidResetLink'),
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'OK'
        }).then(() => router.push('/forgot-password'));
      }
    })();
  }, [token, router, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.password2) {
      setError(t('passwordsNotMatch'));
      return;
    }

    if (passwordStrength.score < 3) {
      setError(t('passwordTooWeak'));
      return;
    }

    setLoading(true);

    const result = await resetPassword(formData.email, token!, formData.password);

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? t('somethingWrong'));
      return;
    }

    router.push("/login?reset=success");
  }

  if (tokenValid === null) {
    return <p className="text-center text-gray-600">{tComm('loading') || 'Loading...'}</p>;
  }

  return (
    <div className="flex flex-col items-center">
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
        <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={200}
                  height={80}
                  className="main-logo mx-auto"
                  priority
                />
        <h1 className="text-xl font-semibold">{t('resetPassword')}</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder={t('email')}
          className="input"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
        />

        <div>
          <input
            type="password"
            placeholder={t('password')}
            className="input"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          {formData.password && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium">
                  {passwordStrength.label}
                </span>
              </div>

              {passwordStrength.suggestions.length > 0 && (
                <ul className="text-xs text-gray-600 space-y-1">
                  {passwordStrength.suggestions.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <input
          type="password"
          placeholder={t('repeatPassword')}
          className="input"
          value={formData.password2}
          onChange={(e) =>
            setFormData({ ...formData, password2: e.target.value })
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="button w-full disabled:opacity-50"
        >
          {loading ? t('resetting') : t('resetPassword')}
        </button>
      </form>
    </div>
  );
}
