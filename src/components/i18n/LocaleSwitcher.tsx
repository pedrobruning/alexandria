"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, LOCALE_COOKIE, LOCALE_LABELS, type Locale } from "@/i18n/locales";

function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

// Cookie-based locale switch: write the cookie, then refresh so server
// components re-render with the new messages.
export function LocaleSwitcher() {
  const active = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function select(locale: Locale) {
    if (locale === active) return;
    persistLocale(locale);
    startTransition(() => router.refresh());
  }

  return (
    <div className="row gap-2" role="group" aria-label="Language">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          className={"chip" + (locale === active ? " chip--on" : "")}
          aria-pressed={locale === active}
          disabled={pending}
          onClick={() => select(locale)}
        >
          {LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
