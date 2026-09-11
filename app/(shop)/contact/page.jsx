import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const INSTAGRAM_URL = "https://instagram.com/hajoubi";
const CONTACT_EMAIL = "contact@hajoubi.dz";

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <div className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">{t("instagram")}</p>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-medium underline">
            @hajoubi
          </a>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">{t("email")}</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 inline-block font-medium">
            {CONTACT_EMAIL}
          </a>
        </div>
        <div className="border-t border-neutral-100 pt-4">
          <p className="text-xs uppercase tracking-wide text-neutral-400">{t("developer")}</p>
          <p className="mt-1 font-medium">{t("developerName")}</p>
          <p className="text-sm text-neutral-600">{t("developerContact")}</p>
        </div>
      </div>
    </div>
  );
}
