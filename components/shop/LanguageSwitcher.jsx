"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { setUserLocale } from "@/i18n/locale";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  const switchTo = (next) => {
    if (next === locale) return;
    startTransition(async () => {
      await setUserLocale(next);
      window.location.reload();
    });
  };

  return (
    <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white p-0.5 text-xs font-semibold">
      <button
        type="button"
        disabled={pending}
        onClick={() => switchTo("fr")}
        className={`px-2.5 py-1 rounded-full ${locale === "fr" ? "bg-black text-white" : "text-neutral-600"}`}
      >
        FR
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => switchTo("ar")}
        className={`px-2.5 py-1 rounded-full ${locale === "ar" ? "bg-black text-white" : "text-neutral-600"}`}
      >
        AR
      </button>
    </div>
  );
}
