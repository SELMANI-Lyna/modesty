import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CategoryIcon } from "./CategoryIcons";

const CATEGORY_KEYS = ["VESTE", "ENSEMBLE", "ROBE", "JUPE", "HIJAB", "PANTALON", "SCARF", "ABAYA"];

export default async function CategoryNav() {
  const t = await getTranslations("categories");
  const home = await getTranslations("home");
  const common = await getTranslations("common");

  return (
    <section className="py-2">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-800 sm:text-xl">
          {home("browseCategories")}
        </h2>
        <Link
          href="/produits"
          className="shrink-0 text-sm font-medium text-[#8B7CD8] transition-opacity hover:opacity-80"
        >
          {common("viewAll")}
        </Link>
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-4 xl:grid-cols-8">
        {CATEGORY_KEYS.map((key) => (
          <Link
            key={key}
            href={`/produits?category=${key}`}
            className="group flex min-w-[148px] flex-col items-center rounded-[1.6rem] border border-neutral-100 bg-white px-4 py-6 text-center shadow-[0_8px_24px_rgba(101,85,182,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#8B7CD8]/25 hover:shadow-[0_12px_28px_rgba(139,124,216,0.14)] sm:min-w-0"
          >
            <span className="transition-transform duration-300 group-hover:scale-105">
              <CategoryIcon name={key} />
            </span>
            <span className="mt-4 text-sm font-medium text-neutral-800">{t(key)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
