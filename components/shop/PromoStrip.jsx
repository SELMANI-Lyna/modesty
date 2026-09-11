import { getTranslations } from "next-intl/server";
import ProductCard from "./ProductCard";

export default async function PromoStrip({ products = [] }) {
  const t = await getTranslations("home");
  if (!products.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-neutral-900">{t("promosTitle")}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
        {products.map((product) => (
          <div key={product.id} className="min-w-[180px] max-w-[180px] snap-start sm:min-w-[220px] sm:max-w-[220px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
