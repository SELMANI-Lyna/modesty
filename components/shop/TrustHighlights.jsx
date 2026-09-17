import { getTranslations } from "next-intl/server";

const ICONS = {
  truck: (
    <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" stroke="#6555B6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 20V9h16v11" />
      <path d="M19 13h6l4 5v2h-10V13z" />
      <circle cx="8" cy="22" r="2.4" />
      <circle cx="23" cy="22" r="2.4" />
    </svg>
  ),
  card: (
    <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" stroke="#6555B6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="8" width="24" height="16" rx="2.5" />
      <path d="M4 13h24" />
      <path d="M8 19h6" />
    </svg>
  ),
  heart: (
    <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" stroke="#6555B6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 26s-9-5.6-9-12a5.4 5.4 0 0 1 9-3.8A5.4 5.4 0 0 1 25 14c0 6.4-9 12-9 12z" />
    </svg>
  ),
  refresh: (
    <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" stroke="#6555B6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 16a9 9 0 0 1 15.3-6.4L25 12" />
      <path d="M25 6v6h-6" />
      <path d="M25 16a9 9 0 0 1-15.3 6.4L7 20" />
      <path d="M7 26v-6h6" />
    </svg>
  ),
};

const KEYS = ["shipping", "payment", "orders", "satisfaction"];
const ICON_FOR = {
  shipping: "truck",
  payment: "card",
  orders: "heart",
  satisfaction: "refresh",
};

export default async function TrustHighlights() {
  const t = await getTranslations("home");

  return (
    <section className="rounded-[2rem] bg-[#faf8f6] px-4 py-10 sm:px-6 sm:py-12">
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {KEYS.map((key) => (
          <div key={key} className="flex flex-col items-center text-center">
            {ICONS[ICON_FOR[key]]}
            <h3 className="mt-3 text-sm font-semibold text-[#8B7CD8] sm:text-base">
              {t(`trust${capitalize(key)}Title`)}
            </h3>
            <p className="mt-1 max-w-[16rem] text-xs text-neutral-500 sm:text-sm">
              {t(`trust${capitalize(key)}Text`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
