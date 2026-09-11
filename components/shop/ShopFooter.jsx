import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function ShopFooter() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-neutral-500">© {new Date().getFullYear()} Hajoubi — {t("rights")}</p>
        <div className="flex flex-wrap gap-4 text-xs text-neutral-600">
          <Link href="/produits">{nav("shop")}</Link>
          <Link href="/collections">{nav("collections")}</Link>
          <Link href="/contact">{nav("contact")}</Link>
        </div>
      </div>
    </footer>
  );
}
