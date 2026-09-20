import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const INSTAGRAM_URL = "https://www.instagram.com/hajoubi_modesty/";
const CONTACT_EMAIL = "lynaselmani16@gmail.com";
const DEVELOPER_URL = "https://github.com/SELMANI-Lyna";

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <div className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">{t("instagram")}</p>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-medium underline">
            @hajoubi_modesty
          </a>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">{t("email")}</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 inline-block font-medium underline">
            {CONTACT_EMAIL}
          </a>
        </div>
        <div className="border-t border-neutral-100 pt-4">
          <p className="text-xs uppercase tracking-wide text-neutral-400">{t("developer")}</p>
          <a
            href={DEVELOPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block font-medium underline text-neutral-900 hover:text-[#8B7CD8] transition-colors break-all"
          >
            {DEVELOPER_URL}
          </a>
        </div>
      </div>
    </div>
  );
}
