"use server";

import { cookies } from "next/headers";

const LOCALES = ["fr", "ar"];

export async function setUserLocale(locale) {
  if (!LOCALES.includes(locale)) return;
  const store = await cookies();
  store.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
