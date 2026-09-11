import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const LOCALES = ["fr", "ar"];

export default getRequestConfig(async () => {
  const store = await cookies();
  let locale = store.get("locale")?.value || "fr";
  if (!LOCALES.includes(locale)) locale = "fr";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
