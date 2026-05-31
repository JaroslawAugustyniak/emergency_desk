"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://api.starter.localhost";

export default function VerifyEmailPage() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');

  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      router.push('/register');
    }
  }, [email, router]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    if (!/^\d{6}$/.test(pastedData)) return;

    const newCode = pastedData.split("");
    setCode(newCode);
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      setError(t('verifyCodeIncomplete'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('verifyCodeError'));
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(t('verifyCodeError'));
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage(null);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('resendError'));
        setResendLoading(false);
        return;
      }

      setResendMessage(t('resendSuccess'));
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(t('resendError'));
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-8">
        <Image
          src="/images/logo.png"
          alt="Logo"
          width={150}
          height={80}
          className="main-logo mx-auto"
          priority
        />
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">{t('verifyEmail')}</h1>
          <p className="text-sm text-gray-600">
            {t('verifyEmailDescription')} <strong>{email}</strong>
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm text-center">
            {t('verifySuccess')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {resendMessage && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
                {resendMessage}
              </div>
            )}

            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  disabled={isLoading || success}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || success}
              className="btn-primary w-full button"
            >
              {isLoading ? t('verifying') : t('verify')}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || isLoading || success}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? t('resending') : t('resendCode')}
              </button>
            </div>

            <div className="text-center">
              <a href="/register" className="text-sm text-slate-500 hover:text-slate-700">
                {t('backToRegister')}
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}