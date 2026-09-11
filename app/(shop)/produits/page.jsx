import { getTranslations } from "next-intl/server";
import { getProductsSortedByOrders, getPromoProducts } from "@/lib/products";
import PromoStrip from "@/components/shop/PromoStrip";
import ShopCatalog from "@/components/shop/ShopCatalog";

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
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold text-neutral-900">{t("title")}</h1>
      <PromoStrip products={JSON.parse(JSON.stringify(promos))} />
      <ShopCatalog
        initialProducts={JSON.parse(JSON.stringify(products))}
        category={category}
      />
    </div>
  );
}
