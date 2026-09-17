import { getTranslations } from "next-intl/server";
import { getProductsSortedByOrders, getPromoProducts } from "@/lib/products";
import PromoStrip from "@/components/shop/PromoStrip";
import MarqueeBanner from "@/components/shop/MarqueeBanner";
import ProductsShell from "@/components/shop/ProductsShell";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const category = params?.category || null;
  const t = await getTranslations("shop");
  const [promos, products] = await Promise.all([
    getPromoProducts(),
    getProductsSortedByOrders({ category: category || undefined }),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-neutral-900">{t("title")}</h1>
      <ProductsShell
        initialProducts={JSON.parse(JSON.stringify(products))}
        category={category}
      >
        <div className="mb-6 -mx-4 overflow-hidden sm:mx-0 sm:rounded-2xl">
          <MarqueeBanner />
        </div>
        <div className="mb-8">
          <PromoStrip products={JSON.parse(JSON.stringify(promos))} />
        </div>
      </ProductsShell>
    </div>
  );
}
