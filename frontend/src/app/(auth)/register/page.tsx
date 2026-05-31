"use client";

import { registerUser } from "./actions";
import { useState, useMemo } from "react";
import { calculatePasswordStrength } from "@/lib/passwordStrength";
import Image from "next/image";
import { useTranslations } from 'next-intl';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
    terms: false,
  });

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(formData.password),
    [formData.password]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("password2", formData.password2);
    if (formData.terms) data.append("terms", "on");

    const result = await registerUser(data);
    if (result?.error) {
      setError(result.error);
    }
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-semibold">{t('createAccount')}</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <input
        name="name"
        placeholder={t('name')}
        className="input"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        name="email"
        type="email"
        placeholder={t('email')}
        className="input"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <div>
        <input
          name="password"
          type="password"
          placeholder={t('password')}
          className="input"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              <span className="text-xs font-medium min-w-15">
                {passwordStrength.label}
              </span>
            </div>

            {passwordStrength.suggestions.length > 0 && (
              <ul className="text-xs text-gray-600 space-y-1">
                {passwordStrength.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <span className="text-gray-400">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <input
        name="password2"
        type="password"
        placeholder={t('repeatPassword')}
        className="input"
        value={formData.password2}
        onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="terms"
          checked={formData.terms}
          onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
        />{" "}
        {t('acceptTerms')}
      </label>

      <button className="btn-primary w-full button">{t('register')}</button>

      <a href="/login" className=" float-end mt-1.5 text-slate-500 text-sm">{t('haveAccount')}</a>

    </form>
    </div>
  );
}
