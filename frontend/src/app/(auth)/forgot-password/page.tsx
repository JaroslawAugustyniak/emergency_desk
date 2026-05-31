"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from 'next-intl';



export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://api.starter.localhost";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    // Zawsze pokazujemy ten sam komunikat (bezpieczne)
    setSent(true);
  }

  if (sent) {
    return (
      <>      <Image
                                        src="/images/logo.png"
                                        alt="Logo"
                                        width={150}
                                        height={80}
                                        className="main-logo mx-auto"
                                        priority
                                      />
                                      <h1 className="text-xl font-semibold  mt-2.5">{t('resetPassword')}</h1>
      <p className="text-sm text-slate-600 my-2.5">
        {t('resetLinkSent')}
      </p>
      <a href="/login" className=" float-end mt-1.5 text-slate-500 text-sm">{t('gobacktologin')}</a>
      </>

    );
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      <Image
                                        src="/images/logo.png"
                                        alt="Logo"
                                        width={150}
                                        height={80}
                                        className="main-logo mx-auto"
                                        priority
                                      />
                                      <h1 className="text-xl font-semibold">{t('resetPassword')}</h1>
      <div>
        <label className="label">{t('email')}</label>
        <input
          type="email"
          required
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <button className="button">
        {t('sendResetLink')}
      </button>
    </form>

    <a href="/login" className=" float-end mt-1.5 text-slate-500 text-sm">{t('gobacktologin')}</a>
    </>
  );
}
